import Link from 'next/link';

export default function PoliticaDePrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--fundo-claro)', padding: '50px 20px' }}>
      <main style={{ maxWidth: '820px', margin: '0 auto', background: 'var(--card)', padding: '40px 36px', borderRadius: '18px', border: '1px solid var(--borda)', boxShadow: 'var(--k-shadow)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', color: 'var(--texto)', margin: '0 0 16px' }}>Política de Privacidade</h1>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          O GestorPro valoriza a privacidade e a segurança dos dados de suas empresas contratantes e de seus clientes finais, em estrita conformidade com as leis de proteção de dados vigentes (LGPD).
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>1. Informações Coletadas</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          Coletamos dados fornecidos no cadastro, como nome, e-mail, segmento de atuação (ótica, comércio, serviços), razão social/nome fantasia e número de WhatsApp, bem como dados necessários para a operação do catálogo e gerenciamento das encomendas e ordens.
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>2. Armazenamento e Segurança</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          Todos os dados são armazenados em infraestrutura de banco de dados protegida por Row Level Security (RLS) e criptografia, garantindo que apenas a conta corporativa autenticada tenha acesso aos registros de sua própria loja, estoque e finanças.
        </p>

        <h3 style={{ marginTop: '24px', color: 'var(--texto)' }}>3. Contato dos Clientes do Catálogo</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.7', fontSize: '15px' }}>
          Os leads gerados quando um comprador ou cliente finaliza um pedido ou orçamento no catálogo público pertencem com total exclusividade à empresa titular daquele catálogo.
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
