'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Usuario, UsuarioStatus } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Usuario | null;
  loading: boolean;
  theme: 'claro' | 'escuro';
  toggleTheme: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<Usuario | null>;
  // Propriedades e permissões de acesso
  status: UsuarioStatus;
  ativo: boolean;
  masterAcess: boolean;
  masteracess: boolean;
  isApproved: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isActive: boolean;
  isMaster: boolean;
  canAccessSystem: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  theme: 'claro',
  toggleTheme: async () => {},
  logout: async () => {},
  refreshProfile: async () => null,
  status: 'pendente',
  ativo: false,
  masterAcess: false,
  masteracess: false,
  isApproved: false,
  isPending: true,
  isSuspended: false,
  isActive: false,
  isMaster: false,
  canAccessSystem: false,
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
        const isMasterUser = Boolean(data.masteracess ?? data.masterAcess);
        const normalized: Usuario = {
          ...data,
          status: (data.status as UsuarioStatus) || 'pendente',
          ativo: data.ativo ?? true,
          masteracess: isMasterUser,
          masterAcess: isMasterUser,
          email: data.email || currentUser?.email || null,
        };

        // Sincroniza email na tabela caso esteja ausente
        if (!data.email && currentUser?.email) {
          supabase.from('usuarios').update({ email: currentUser.email }).eq('id', userId).then();
        }

        setProfile(normalized);
        if (data.tema === 'escuro' || data.tema === 'claro') {
          applyTheme(data.tema);
        }
        return normalized;
      }

      // Fallback profile if record not yet created
      const fallback: Usuario = {
        id: userId,
        nome: currentUser?.user_metadata?.nome || currentUser?.email?.split('@')[0] || 'Usuário',
        email: currentUser?.email || null,
        slug: 'loja',
        tema: 'claro',
        mostrar_preco: true,
        mostrar_estoque: true,
        mostrar_tempo: true,
        aceitou_termos: true,
        aceitou_politica: true,
        status: 'pendente',
        ativo: true,
        masteracess: false,
        masterAcess: false,
      };

      try {
        const { data: inserted } = await supabase
          .from('usuarios')
          .insert({
            id: fallback.id,
            nome: fallback.nome,
            email: fallback.email,
            slug: (fallback.nome.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'loja') + '-' + userId.slice(0, 4),
            tema: fallback.tema,
            status: 'pendente',
            ativo: true,
            masteracess: false,
          })
          .select('*')
          .maybeSingle();

        if (inserted) {
          const insertedNormalized: Usuario = {
            ...inserted,
            status: (inserted.status as UsuarioStatus) || 'pendente',
            ativo: inserted.ativo ?? true,
            masteracess: Boolean(inserted.masteracess ?? inserted.masterAcess),
            masterAcess: Boolean(inserted.masteracess ?? inserted.masterAcess),
            email: inserted.email || currentUser?.email || null,
          };
          setProfile(insertedNormalized);
          return insertedNormalized;
        }
      } catch {
        // Ignora erro se RLS impedir insert direto
      }

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

  // Avaliação de permissões e controle de acesso
  const status: UsuarioStatus = (profile?.status as UsuarioStatus) || 'pendente';
  const ativo: boolean = profile?.ativo ?? true;
  const isMaster: boolean = Boolean(profile?.masteracess || profile?.masterAcess);
  const isApproved: boolean = status === 'aprovado';
  const isPending: boolean = status === 'pendente';
  const isSuspended: boolean = status === 'suspenso';
  const isActive: boolean = ativo !== false;
  // O usuário pode acessar o sistema se estiver aprovado E ativo, ou se for Master
  const canAccessSystem: boolean = (isApproved && isActive) || isMaster;

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
        status,
        ativo,
        masterAcess: isMaster,
        masteracess: isMaster,
        isApproved,
        isPending,
        isSuspended,
        isActive,
        isMaster,
        canAccessSystem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

