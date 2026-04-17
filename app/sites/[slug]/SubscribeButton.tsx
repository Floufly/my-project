'use client';

import { useState } from 'react';

type Props = {
  planId: string;
  slug: string;
  highlighted: boolean;
  primaryColor: string;
};

export default function SubscribeButton({ planId, slug, highlighted, primaryColor }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? 'Erreur lors de la création du paiement');
        setLoading(false);
      }
    } catch {
      alert('Erreur réseau');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`plan-btn ${highlighted ? 'primary' : 'secondary'}`}
      style={highlighted ? { background: primaryColor } : undefined}
    >
      {loading ? 'Chargement...' : 'Commencer gratuitement'}
    </button>
  );
}
