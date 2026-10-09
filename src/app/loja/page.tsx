'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LojaSlugPage from './[slug]/page';

function LojaQueryContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  if (!slug) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fbfaf8', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h2>Catálogo não especificado</h2>
          <p className="muted">O link precisa conter o identificador da loja (ex.: /loja/[slug]).</p>
        </div>
      </div>
    );
  }

  return <LojaSlugPage />;
}

export default function LojaPage() {
  return (
    <Suspense fallback={<div>Carregando catálogo...</div>}>
      <LojaQueryContent />
    </Suspense>
  );
}
