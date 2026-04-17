'use client';

import { useState, useEffect } from 'react';
import { BUSINESS_CATEGORIES } from '@/lib/scanner';
import type { ScannedBusiness } from '@/lib/scanner-db';

type Stats = {
  total: number;
  noWebsite: number;
  generated: number;
  contacted: number;
  converted: number;
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Nouveau',
  site_generated: 'Site créé',
  contacted: 'Contacté',
  converted: 'Client',
  rejected: 'Rejeté',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#6b7280',
  site_generated: '#2563eb',
  contacted: '#d97706',
  converted: '#16a34a',
  rejected: '#dc2626',
};

export default function ScannerPage() {
  const [city, setCity] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>(BUSINESS_CATEGORIES.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<ScannedBusiness[]>([]);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(true);
  const [filterCity, setFilterCity] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function loadStats() {
    const res = await fetch('/api/scanner?action=stats');
    const data = await res.json();
    setStats(data);
  }

  async function loadBusinesses() {
    const params = new URLSearchParams({ action: 'list' });
    if (noWebsiteOnly) params.set('noWebsite', '1');
    if (filterCity) params.set('city', filterCity);
    const res = await fetch(`/api/scanner?${params}`);
    const data = await res.json();
    setBusinesses(data);
  }

  useEffect(() => {
    loadStats();
    loadBusinesses();
  }, []);

  async function handleGenerateAll() {
    setGeneratingAll(true);
    setMessage('Génération des sites en cours...');
    try {
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateAll: true, city: filterCity || undefined }),
      });
      const data = await res.json();
      setMessage(`${data.generated} sites générés avec succès !`);
      await loadStats();
      await loadBusinesses();
    } catch {
      setMessage('Erreur lors de la génération des sites');
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleGenerateOne(placeId: string) {
    setGeneratingId(placeId);
    try {
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadBusinesses();
      await loadStats();
      window.open(data.url, '_blank');
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setMessage('Scan en cours... (peut prendre quelques minutes)');
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), categories: selectedCats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      await loadStats();
      await loadBusinesses();
    } catch (err) {
      setMessage(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Scanner Google Maps</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Trouve les commerces sans site web et génère-leur un site automatiquement.
      </p>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total scanné', value: stats.total, color: '#1e293b' },
            { label: 'Sans site web', value: stats.noWebsite, color: '#dc2626' },
            { label: 'Sites créés', value: stats.generated, color: '#2563eb' },
            { label: 'Contactés', value: stats.contacted, color: '#d97706' },
            { label: 'Clients', value: stats.converted, color: '#16a34a' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.5rem', minWidth: 120 }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Scan Form */}
      <form onSubmit={handleScan} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Lancer un scan</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>Ville</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ex: Paris, Lyon, Marseille..."
            required
            style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>
            Catégories ({selectedCats.length} sélectionnées)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: selectedCats.includes(cat) ? '#2563eb' : '#cbd5e1',
                  background: selectedCats.includes(cat) ? '#eff6ff' : 'white',
                  color: selectedCats.includes(cat) ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || selectedCats.length === 0}
          style={{
            background: loading ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Scan en cours...' : 'Lancer le scan'}
        </button>

        {message && (
          <p style={{ marginTop: 12, color: message.startsWith('Erreur') ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
            {message}
          </p>
        )}
      </form>

      {/* Results */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Résultats ({businesses.length})</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="Filtrer par ville..."
              style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={noWebsiteOnly}
                onChange={(e) => setNoWebsiteOnly(e.target.checked)}
              />
              Sans site seulement
            </label>
                <button
              onClick={loadBusinesses}
              style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Actualiser
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              style={{ padding: '0.4rem 0.8rem', background: generatingAll ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', borderRadius: 6, cursor: generatingAll ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              {generatingAll ? 'Génération...' : '⚡ Générer tous les sites'}
            </button>
          </div>
        </div>

        {businesses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 8 }}>
            Aucun résultat. Lancez un scan pour commencer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {businesses.map((b) => (
              <div key={b.placeId} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{b.name}</span>
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      background: '#f1f5f9',
                      color: '#475569',
                    }}>
                      {b.category}
                    </span>
                  </div>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: '0.8rem',
                    background: STATUS_COLOR[b.status] + '20',
                    color: STATUS_COLOR[b.status],
                    fontWeight: 600,
                  }}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#64748b' }}>
                  📍 {b.address}
                  {b.phone && <span style={{ marginLeft: 12 }}>📞 {b.phone}</span>}
                  {b.rating && <span style={{ marginLeft: 12 }}>⭐ {b.rating} ({b.reviewCount} avis)</span>}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {!b.hasWebsite && (
                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                      ✗ Pas de site web
                    </span>
                  )}
                  {!b.hasWebsite && b.status === 'new' && (
                    <button
                      onClick={() => handleGenerateOne(b.placeId)}
                      disabled={generatingId === b.placeId}
                      style={{ padding: '4px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      {generatingId === b.placeId ? '...' : '🌐 Générer le site'}
                    </button>
                  )}
                  {b.generatedSiteUrl && (
                    <a
                      href={b.generatedSiteUrl}
                      target="_blank"
                      rel="noopener"
                      style={{ padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      👁️ Voir le site
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
