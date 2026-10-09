import { supabase } from './supabase';

export function formatMoney(val: number | string | null | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'loja';
}

export function supabaseErrorText(error: any): string {
  if (!error) return 'Ocorreu um erro. Tente novamente.';
  const message = error.message || '';
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('already registered')) return 'Este e-mail já está cadastrado.';
  if (message.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  return message;
}

export async function uploadToStorage(bucket: string, file: File, userId: string): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    throw new Error('Escolha uma imagem JPG, PNG, WEBP ou arquivo PDF.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('O arquivo deve ter no máximo 10 MB.');
  }

  const ext = (file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')).toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  // Tenta o bucket solicitado
  let uploadRes = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: '3600',
  });

  // Se o bucket não existir, tenta o bucket 'produtos' que já existe por padrão
  let finalBucket = bucket;
  if (uploadRes.error && bucket !== 'produtos') {
    const retry = await supabase.storage.from('produtos').upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: '3600',
    });
    if (!retry.error) {
      uploadRes = retry;
      finalBucket = 'produtos';
    }
  }

  if (uploadRes.error) {
    throw new Error(`Não foi possível enviar o arquivo: ${uploadRes.error.message}`);
  }

  const { data } = supabase.storage.from(finalBucket).getPublicUrl(path);
  return data.publicUrl;
}
