import Link from 'next/link';

export default function TermosDeUsoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--fundo-claro)', padding: '50px 20px' }}>
      <main style={{ maxWidth: '820px', margin: '0 auto', background: 'var(--card)', padding: '40px 36px', borderRadius: '18px', border: '1px solid var(--borda)', boxShadow: 'var(--k-shadow)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', color: 'var(--texto)', margin: '0 0 16px' }}>Termos de Uso</h1>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          Bem-vindo ao GestorPro. Ao acessar ou usar nosso sistema de gestão empresarial, comercial e de serviços (incluindo óticas, varejos e prestadores), você concorda com estes Termos de Uso.
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>1. Uso da Plataforma</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          O GestorPro disponibiliza ferramentas integradas para frente de caixa e vendas, ordens de serviço e encomendas, controle de compras e estoque, fichas técnicas/prescrições e catálogo digital. Cada usuário e empresa é responsável pelas informações comerciais e produtos cadastrados.
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>2. Conta e Segurança</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          Você é responsável por manter a confidencialidade das credenciais de acesso à sua conta corporativa e por todas as operações nela realizadas por seus colaboradores.
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>3. Catálogo e Encomendas</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          O catálogo comercial público permite que seus clientes consultem mercadorias e façam pedidos por meio de canais integrados (como WhatsApp). Os dados e preços informados são de responsabilidade da respectiva empresa anunciante.
        </p>

        <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--borda)' }}>
          <Link href="/login" className="btn btn-secondary">
            ← Voltar ao GestorPro
          </Link>
        </div>
      </main>
    </div>
  );
}
