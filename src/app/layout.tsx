import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'GestorPro — Sistema de Gestão Empresarial & Comercial',
  description: 'Sistema integrado de gestão para comércios, óticas, varejo e serviços: vendas, compras, estoque, ordens de serviço, catálogo online e financeiro.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem("kroche_theme") === "escuro") {
                  document.documentElement.setAttribute("data-theme", "escuro");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
