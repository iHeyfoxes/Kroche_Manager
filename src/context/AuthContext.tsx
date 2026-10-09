'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Usuario | null;
  loading: boolean;
  theme: 'claro' | 'escuro';
  toggleTheme: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<Usuario | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  theme: 'claro',
  toggleTheme: async () => {},
  logout: async () => {},
  refreshProfile: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'claro' | 'escuro'>('claro');

  const applyTheme = useCallback((newTheme: 'claro' | 'escuro') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kroche_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const loadProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Usuario);
        if (data.tema === 'escuro' || data.tema === 'claro') {
          applyTheme(data.tema);
        }
        return data as Usuario;
      }

      // Fallback profile if record not yet created
      const fallback: Usuario = {
        id: userId,
        nome: currentUser?.user_metadata?.nome || currentUser?.email?.split('@')[0] || 'Usuário',
        slug: 'loja',
        tema: 'claro',
        mostrar_preco: true,
        mostrar_estoque: true,
        mostrar_tempo: true,
        aceitou_termos: true,
        aceitou_politica: true,
      };
      setProfile(fallback);
      return fallback;
    } catch (err) {
      console.warn('Erro ao carregar perfil:', err);
      return null;
    }
  }, [applyTheme]);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return await loadProfile(user.id, user);
  }, [user, loadProfile]);

  useEffect(() => {
    // Initial saved theme
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('kroche_theme') as 'claro' | 'escuro';
      if (savedTheme === 'escuro') {
        applyTheme('escuro');
      }
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser.id, currentUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser.id, currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [applyTheme, loadProfile]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'escuro' ? 'claro' : 'escuro';
    applyTheme(nextTheme);
    if (user && profile) {
      try {
        await supabase.from('usuarios').update({ tema: nextTheme }).eq('id', user.id);
        setProfile((prev) => prev ? { ...prev, tema: nextTheme } : null);
      } catch (err) {
        console.error('Erro ao salvar tema:', err);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        toggleTheme,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
