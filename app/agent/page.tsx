'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentState, AgentLog } from '@/lib/agent-db';
import { BUSINESS_CATEGORIES } from '@/lib/scanner';

const LEVEL_COLOR: Record<string, string> = {
  info: '#94a3b8',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const LEVEL_ICON: Record<string, string> = {
  info: '→',
  success: '✓',
  warning: '⚠',
  error: '✗',
};

const ALL_CITIES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Nantes', 'Lille', 'Nice', 'Strasbourg', 'Rennes'];

export default function AgentPage() {
  const [state, setState] = useState<AgentState | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'config' | 'logs'>('dashboard');
  const [configDraft, setConfigDraft] = useState<AgentState['config'] | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadState = useCallback(async () => {
    const [stateRes, logsRes] = await Promise.all([
      fetch('/api/agent'),
      fetch('/api/agent?action=logs'),
    ]);
    const s: AgentState = await stateRes.json();
    const l: AgentLog[] = await logsRes.json();
    setState(s);
    setLogs(l);
    setRunning(s.status === 'running');
    if (!configDraft) setConfigDraft(s.config);
  }, [configDraft]);

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  async function handleStart() {
    setRunning(true);
    const source = new EventSource('/api/agent/run');
    // EventSource only supports GET — use fetch for POST SSE
    source.close();

    // Use fetch with streaming for POST SSE
    const res = await fetch('/api/agent/run', { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? 'Erreur');
      setRunning(false);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const read = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { setRunning(false); loadState(); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'log') {
              setLogs((prev) => [event.data, ...prev.slice(0, 499)]);
            }
            if (event.type === 'state' || event.type === 'done') {
              loadState();
            }
          } catch { /* ignore parse errors */ }
        }
      }
    };
    read();
  }

  async function handleStop() {
    await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
    setRunning(false);
    setTimeout(loadState, 500);
  }

  async function handleSaveConfig() {
    if (!configDraft) return;
    setSavingConfig(true);
    await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-config', config: configDraft }),
    });
    setSavingConfig(false);
    await loadState();
    setTab('dashboard');
  }

  async function handleClearLogs() {
    await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear-logs' }) });
    setLogs([]);
  }

  if (!state || !configDraft) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Chargement...</div>;
  }

  const isIdle = state.status === 'idle' || state.status === 'paused';

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>🤖 Agent Autonome</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: '0.9rem' }}>Scanner · Générer · Contacter · tout seul</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={state.status} currentStep={state.currentStep} />
          {isIdle ? (
            <button onClick={handleStart} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              ▶ Lancer
            </button>
          ) : (
            <button onClick={handleStop} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              ⏹ Arrêter
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {(['dashboard', 'config', 'logs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.6rem 1.2rem', border: 'none', background: 'none', fontWeight: tab === t ? 700 : 400, color: tab === t ? '#2563eb' : '#64748b', borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, cursor: 'pointer', fontSize: '0.95rem', textTransform: 'capitalize' }}>
            {t === 'dashboard' ? '📊 Tableau de bord' : t === 'config' ? '⚙️ Configuration' : '📋 Logs'}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '2rem' }}>
            {[
              { label: 'Commerces scannés', value: state.totalScanned, icon: '🔍', color: '#2563eb' },
              { label: 'Sites générés', value: state.totalGenerated, icon: '🌐', color: '#7c3aed' },
              { label: 'SMS envoyés', value: state.totalContacted, icon: '📨', color: '#0369a1' },
              { label: 'Clients convertis', value: state.totalConverted, icon: '💰', color: '#16a34a' },
            ].map((s) => (
              <div key={s.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Schedule info */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Planning</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InfoRow label="Dernier run" value={state.lastRunAt ? new Date(state.lastRunAt).toLocaleString('fr-FR') : '—'} />
              <InfoRow label="Prochain run" value={state.nextRunAt ? new Date(state.nextRunAt).toLocaleString('fr-FR') : '—'} />
              <InfoRow label="Intervalle" value={`Toutes les ${state.config.intervalHours}h`} />
              <InfoRow label="Contact auto" value={state.config.autoContact ? '✅ Activé' : '❌ Désactivé'} />
            </div>
          </div>

          {/* Config summary */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Configuration active</h3>
              <button onClick={() => setTab('config')} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                Modifier
              </button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Villes : </span>
              {state.config.cities.map((c) => <Tag key={c} label={c} color="#2563eb" />)}
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Catégories : </span>
              {state.config.categories.map((c) => <Tag key={c} label={c} color="#7c3aed" />)}
            </div>
          </div>
        </div>
      )}

      {/* Config tab */}
      {tab === 'config' && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Configuration de l'agent</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Villes à scanner</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_CITIES.map((city) => {
                const active = configDraft.cities.includes(city);
                return (
                  <button key={city} type="button" onClick={() => setConfigDraft((c) => c ? { ...c, cities: active ? c.cities.filter((v) => v !== city) : [...c.cities, city] } : c)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid', borderColor: active ? '#2563eb' : '#cbd5e1', background: active ? '#eff6ff' : 'white', color: active ? '#2563eb' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {city}
                  </button>
                );
              })}
            </div>
            <input placeholder="Ajouter une ville..." onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setConfigDraft((c) => c ? { ...c, cities: [...c.cities, e.currentTarget.value.trim()] } : c); e.currentTarget.value = ''; } }}
              style={{ marginTop: 8, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, width: '100%', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Catégories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BUSINESS_CATEGORIES.map((cat) => {
                const active = configDraft.categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => setConfigDraft((c) => c ? { ...c, categories: active ? c.categories.filter((v) => v !== cat) : [...c.categories, cat] } : c)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid', borderColor: active ? '#7c3aed' : '#cbd5e1', background: active ? '#f5f3ff' : 'white', color: active ? '#7c3aed' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Intervalle entre les runs</label>
              <select value={configDraft.intervalHours} onChange={(e) => setConfigDraft((c) => c ? { ...c, intervalHours: Number(e.target.value) } : c)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem' }}>
                {[1, 6, 12, 24, 48, 72].map((h) => <option key={h} value={h}>{h}h</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Max commerces / run</label>
              <select value={configDraft.maxBusinessesPerRun} onChange={(e) => setConfigDraft((c) => c ? { ...c, maxBusinessesPerRun: Number(e.target.value) } : c)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem' }}>
                {[10, 25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={configDraft.autoContact} onChange={(e) => setConfigDraft((c) => c ? { ...c, autoContact: e.target.checked } : c)} style={{ width: 18, height: 18 }} />
              Contacter automatiquement les commerces par SMS
            </label>
            {configDraft.autoContact && !process.env.TWILIO_ACCOUNT_SID && (
              <p style={{ marginTop: 6, fontSize: '0.82rem', color: '#f59e0b' }}>⚠ Twilio non configuré — ajoutez TWILIO_ACCOUNT_SID dans .env.local</p>
            )}
          </div>

          <button onClick={handleSaveConfig} disabled={savingConfig}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 2rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            {savingConfig ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={handleClearLogs} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
              Effacer les logs
            </button>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 10, padding: '1rem', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: 500, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ color: '#475569', textAlign: 'center', padding: '2rem' }}>Aucun log. Lancez l'agent pour voir l'activité.</p>
            ) : (
              [...logs].reverse().map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '3px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#475569', minWidth: 85, fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleTimeString('fr-FR')}
                  </span>
                  <span style={{ color: LEVEL_COLOR[log.level], minWidth: 14 }}>{LEVEL_ICON[log.level]}</span>
                  <span style={{ color: '#64748b', minWidth: 80 }}>[{log.step}]</span>
                  <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status, currentStep }: { status: string; currentStep: string | null }) {
  const colors: Record<string, { bg: string; color: string }> = {
    idle: { bg: '#f1f5f9', color: '#475569' },
    running: { bg: '#dcfce7', color: '#16a34a' },
    paused: { bg: '#fef3c7', color: '#92400e' },
    error: { bg: '#fee2e2', color: '#dc2626' },
  };
  const c = colors[status] ?? colors.idle;
  const labels: Record<string, string> = { idle: 'En attente', running: 'En cours', paused: 'Pausé', error: 'Erreur' };
  return (
    <span style={{ background: c.bg, color: c.color, padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem' }}>
      {status === 'running' && '● '}{labels[status] ?? status}{currentStep ? ` — ${currentStep}` : ''}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</span>
      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}</div>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', background: color + '15', color, padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', margin: '2px' }}>
      {label}
    </span>
  );
}
