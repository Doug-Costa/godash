'use client';

import React, { useCallback, useEffect, useState } from 'react';

type Kind = 'MERGE_SUGGESTED' | 'PAIR_REVIEW' | 'MIXED_SUSPECT';

interface PersonInfo {
  id: string;
  fullName: string | null;
  email: string | null;
  secondaryEmail: string | null;
  phoneNumber: string | null;
  secondaryPhone: string | null;
  source: string;
  createdAt: string;
  aliasCount: number;
  customerCount: number;
  products: string[];
}

interface AuditItem {
  id: string;
  kind: Kind;
  status: string;
  decision: string | null;
  reason: string | null;
  evidences: string[];
  batchable: boolean;
  obsolete: boolean;
  keep?: PersonInfo | null;
  absorb?: PersonInfo | null;
  person?: PersonInfo | null;
  aliases?: { id: string; source: string; name: string | null; email: string | null; phone: string | null; suspicious: boolean }[];
}

const TABS: { kind: Kind; label: string; help: string }[] = [
  { kind: 'MERGE_SUGGESTED', label: 'Junções sugeridas', help: 'Mesmo e-mail e nome compatível: muito provavelmente a mesma pessoa em duas fichas.' },
  { kind: 'PAIR_REVIEW', label: 'Pares de dúvida', help: 'Sinais parciais (telefone igual, e-mail parecido, nomes diferentes). Decida caso a caso.' },
  { kind: 'MIXED_SUSPECT', label: 'Suspeitas de ficha misturada', help: 'Nomes incompatíveis dentro da mesma ficha. É suspeita, não prova: inspecione. Nada é separado automaticamente.' },
];

const EVIDENCE_LABELS: Record<string, string> = {
  EMAIL_EXACT: '✓ Mesmo e-mail',
  EMAIL_NEAR: '~ E-mail parecido',
  PHONE_EXACT: '✓ Mesmo telefone',
  CPF_EXACT: '✓ Mesmo CPF',
  CPF_DIFFERENT: '⚠️ CPFs diferentes',
  NAME_COMPATIBLE: '✓ Nome compatível',
  NAME_INCOMPATIBLE: '⚠️ Nomes diferentes',
  NAME_UNKNOWN: '? Sem nome',
  BATCHABLE: '⚡ Aprovável em lote',
  SIGNAL_TELEFONE: 'Ligado por telefone',
  SIGNAL_EMAIL: 'Ligado por e-mail',
  SIGNAL_OUTRO: 'Ligado por outro meio',
};

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 };
const btn = (primary = false): React.CSSProperties => ({
  padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  border: primary ? 'none' : '1px solid var(--border)',
  background: primary ? 'var(--accent)' : 'var(--surface)',
  color: primary ? '#fff' : 'var(--text-primary)',
});

function PersonCard({ title, p, highlight }: { title: string; p: PersonInfo; highlight: boolean }) {
  return (
    <div style={{ ...card, border: highlight ? '1px solid var(--accent)' : card.border, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: highlight ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>👤 {p.fullName || 'Sem nome'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
        📧 {p.email || 'Sem e-mail'}{p.secondaryEmail && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}> (Alt: {p.secondaryEmail})</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        📞 {p.phoneNumber || 'Sem telefone'}{p.secondaryPhone && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}> (Alt: {p.secondaryPhone})</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        Origem: {p.source} · {p.aliasCount} registro(s) de origem · {p.customerCount} cadastro(s) · desde {new Date(p.createdAt).toLocaleDateString('pt-BR')}
      </div>
      {p.products.length > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>🎓 {p.products.join(', ')}</div>}
    </div>
  );
}

export default function AuditReviewQueue() {
  const [kind, setKind] = useState<Kind>('MERGE_SUGGESTED');
  const [onlyBatchable, setOnlyBatchable] = useState(false);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Kind, number>>({ MERGE_SUGGESTED: 0, PAIR_REVIEW: 0, MIXED_SUSPECT: 0 });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [swapped, setSwapped] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ kind, limit: '50', offset: String(offset), ...(onlyBatchable ? { batchable: '1' } : {}) });
      const res = await fetch(`/api/leads/identity-review/audit?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Falha ao carregar a fila.');
      setItems(prev => (offset === 0 ? json.data : [...prev, ...json.data]));
      setTotal(json.total);
      setCounts(json.counts);
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }, [kind, onlyBatchable]);

  useEffect(() => {
    setSelected(new Set());
    setConfirmBatch(false);
    load(0);
  }, [load]);

  const act = async (item: AuditItem, action: string, keepPersonId?: string) => {
    setBusyId(item.id);
    setMessage(null);
    try {
      const res = await fetch('/api/leads/identity-review/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewId: item.id, keepPersonId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const texts: Record<string, string> = {
        MERGED: 'Fichas unidas. A operação fica registrada e pode ser desfeita.',
        OBSOLETE: 'Uma das fichas já não existia (provavelmente já unida). Revisão fechada.',
        CLOSED: 'Decisão registrada.',
      };
      setMessage({ text: texts[json.outcome] || 'Decisão registrada.' });
      await load(0);
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setBusyId(null);
    }
  };

  const runBatch = async () => {
    setBusyId('batch');
    setMessage(null);
    try {
      const res = await fetch('/api/leads/identity-review/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BATCH_MERGE', reviewIds: [...selected] }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const by = (o: string) => json.results.filter((r: any) => r.outcome === o).length;
      const failed = by('FAILED') + by('SKIPPED');
      setMessage({
        text: `${by('MERGED')} unidas · ${by('OBSOLETE')} já resolvidas${failed ? ` · ${failed} não processadas (veja e decida individualmente)` : ''}.`,
        error: failed > 0,
      });
      setSelected(new Set());
      setConfirmBatch(false);
      await load(0);
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setBusyId(null);
    }
  };

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const tab = TABS.find(t => t.kind === kind)!;
  const selectedItems = items.filter(i => selected.has(i.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>🧹 Limpeza da base (auditoria de identidade)</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.kind} type="button" onClick={() => setKind(t.kind)} style={{ ...btn(kind === t.kind) }}>
            {t.label} ({counts[t.kind] ?? 0})
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tab.help}</div>

      {kind !== 'MIXED_SUSPECT' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={onlyBatchable} onChange={e => setOnlyBatchable(e.target.checked)} />
            Mostrar só aprováveis em lote
          </label>
          {selected.size > 0 && (
            <button type="button" style={btn(true)} disabled={busyId !== null} onClick={() => setConfirmBatch(true)}>
              Juntar selecionadas ({selected.size})
            </button>
          )}
        </div>
      )}

      {confirmBatch && (
        <div style={{ ...card, border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Confirmar junção de {selectedItems.length} par(es)</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Em cada par, a ficha da direita é absorvida pela da esquerda: os registros e cadastros dela passam para a da esquerda.
            Cada junção fica registrada e pode ser desfeita.
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedItems.map(i => (
              <div key={i.id}>• {i.keep?.fullName || 'Sem nome'} ⟵ {i.absorb?.fullName || 'Sem nome'} <span style={{ color: 'var(--text-muted)' }}>({i.reason})</span></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={btn()} onClick={() => setConfirmBatch(false)} disabled={busyId !== null}>Cancelar</button>
            <button type="button" style={btn(true)} onClick={runBatch} disabled={busyId !== null}>
              {busyId === 'batch' ? 'Juntando…' : `Confirmar ${selectedItems.length} junção(ões)`}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{ ...card, fontSize: 12, color: message.error ? 'var(--danger, #e5484d)' : 'var(--text-primary)' }}>{message.text}</div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ ...card, fontSize: 12, color: 'var(--text-muted)' }}>Nada pendente nesta categoria.</div>
      )}

      {items.map(item => {
        const busy = busyId === item.id || busyId === 'batch';
        const chips = (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.reason && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.reason}</span>}
            {item.evidences.map(ev => (
              <span key={ev} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {EVIDENCE_LABELS[ev] || ev}
              </span>
            ))}
            {item.status === 'DEFERRED' && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({item.decision === 'SPLIT_NEEDED' ? 'marcada para separar' : 'adiada'})</span>}
          </div>
        );

        if (item.obsolete) {
          return (
            <div key={item.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uma das fichas deste caso já não existe (provavelmente já foi unida por outra revisão).</span>
              <button type="button" style={btn()} disabled={busy} onClick={() => act(item, item.kind === 'MIXED_SUSPECT' ? 'CONFIRM_SAME' : 'MERGE')}>Fechar</button>
            </div>
          );
        }

        if (item.kind === 'MIXED_SUSPECT' && item.person) {
          return (
            <div key={item.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chips}
              <PersonCard title="Ficha inspecionada" p={item.person} highlight />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 4 }}>Nome no registro de origem</th><th style={{ padding: 4 }}>E-mail</th><th style={{ padding: 4 }}>Telefone</th><th style={{ padding: 4 }}>Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(item.aliases || []).map(a => (
                      <tr key={a.id} style={{ background: a.suspicious ? 'rgba(229, 72, 77, 0.08)' : undefined }}>
                        <td style={{ padding: 4, fontWeight: a.suspicious ? 700 : 400 }}>{a.suspicious ? '⚠️ ' : ''}{a.name || '—'}</td>
                        <td style={{ padding: 4 }}>{a.email || '—'}</td>
                        <td style={{ padding: 4 }}>{a.phone || '—'}</td>
                        <td style={{ padding: 4, color: 'var(--text-muted)' }}>{a.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" style={btn()} disabled={busy} onClick={() => act(item, 'NEEDS_SPLIT')}>⚠️ Precisa separar (marcar)</button>
                <button type="button" style={btn(true)} disabled={busy} onClick={() => act(item, 'CONFIRM_SAME')}>✓ Está correta, é a mesma pessoa</button>
              </div>
            </div>
          );
        }

        if (!item.keep || !item.absorb) return null;
        const isSwapped = !!swapped[item.id];
        const left = isSwapped ? item.absorb : item.keep;
        const right = isSwapped ? item.keep : item.absorb;

        return (
          <div key={item.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {item.batchable && (
                <input type="checkbox" aria-label="Selecionar para junção em lote" checked={selected.has(item.id)} disabled={isSwapped} onChange={() => toggle(item.id)} />
              )}
              {chips}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              <PersonCard title="Fica" p={left} highlight />
              <PersonCard title="Será absorvida" p={right} highlight={false} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Ao juntar: {right.aliasCount} registro(s) de origem e {right.customerCount} cadastro(s) da direita passam para a da esquerda. Pode ser desfeito.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" style={btn()} disabled={busy} onClick={() => {
                // O lote usa sempre a ficha sugerida; ao inverter, o par sai da seleção do lote
                setSelected(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                setSwapped(s => ({ ...s, [item.id]: !isSwapped }));
              }}>⇄ Inverter qual fica</button>
              <button type="button" style={btn()} disabled={busy} onClick={() => act(item, 'KEEP_SEPARATE')}>✕ São pessoas diferentes</button>
              <button type="button" style={btn(true)} disabled={busy} onClick={() => act(item, 'MERGE', left.id)}>
                {busy ? 'Processando…' : '✓ Juntar'}
              </button>
            </div>
          </div>
        );
      })}

      {items.length < total && (
        <button type="button" style={{ ...btn(), alignSelf: 'center' }} disabled={loading} onClick={() => load(items.length)}>
          {loading ? 'Carregando…' : `Carregar mais (${items.length} de ${total})`}
        </button>
      )}
    </div>
  );
}
