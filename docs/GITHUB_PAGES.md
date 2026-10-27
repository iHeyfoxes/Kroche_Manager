# GitHub Pages (static export)

This branch configures Next.js to export the app into the `out/` directory and adds a GitHub Actions workflow for publishing it to GitHub Pages.

## Important limitations

GitHub Pages serves static files only. It cannot run a Next.js server or API route handlers.

- The server endpoint at `src/app/api/ler-receita/route.ts` is retained as a reference at `docs/reference/ler-receita-route.ts.disabled`; it is not deployed as an API. Recipe reading through the server-side AI endpoint will not work on GitHub Pages until it is moved to a separate backend/serverless function.
- Supabase browser-side features can work if the Supabase project URL/key are configured and its Auth redirect URLs, database policies (RLS), and allowed site URLs include the deployed domain.
- Client-side navigation is supported. With `trailingSlash: true`, static routes are emitted as directories. Test deep links after deployment.
- Never put a Gemini/AI secret key in browser code or in a public repository. Keep it on a backend/serverless function.

## Publish

1. Review and merge this branch into `main`.
2. In repository Settings → Pages, set the build/deployment source to **GitHub Actions**.
3. Confirm the custom domain in `CNAME` (currently `krochemanager.com.br`) and configure the DNS records at the domain provider for GitHub Pages.
4. Push to `main` or run the workflow manually under Actions.
5. Confirm the workflow succeeds before considering the site published.

The workflow build is the validation step; static export can still reveal other incompatible routes or build-time errors that must be fixed before publication.
