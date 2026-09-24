import { withSupabase } from 'npm:@supabase/server@^1';

const BUCKETS = ['produtos', 'banners', 'fotos-perfil'];

async function removerArquivosDoUsuario(admin: any, userId: string) {
  for (const bucket of BUCKETS) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (error) {
      if (error.message?.toLowerCase().includes('not found')) continue;
      throw new Error('Não foi possível limpar os arquivos da conta.');
    }

    const paths = (data || [])
      .filter((item: any) => item?.name)
      .map((item: any) => userId + '/' + item.name);

    if (paths.length) {
      const { error: removeError } = await admin.storage.from(bucket).remove(paths);
      if (removeError) throw new Error('Não foi possível remover os arquivos da conta.');
    }
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, ctx) => {
    const userId = ctx.userClaims?.sub;
    if (!userId) return Response.json({ error: 'Sessão inválida.' }, { status: 401 });

    try {
      await removerArquivosDoUsuario(ctx.supabaseAdmin, userId);

      const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) return Response.json({ error: error.message }, { status: 400 });

      return Response.json({ success: true });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Não foi possível excluir a conta.' },
        { status: 500 }
      );
    }
  }),
};
