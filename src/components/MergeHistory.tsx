'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface MergeItem {
  id: string;
  timestamp: string;
  reason: string;
  decidedBy: string | null;
  absorbed: { id: string; fullName: string | null; email: string | null };
  kept: { id: string; fullName: string | null; email: string | null };
  undone: { at: string; reason: string; byName: string | null } | null;
  canUndo: boolean;
}

interface UndoReport {
  restoredPersonName: string | null;
  aliasesRestored: number;
  aliasesMissing: number;
  customersRepointed: number;
  customersRecreated: number;
  rowsRestored: Record<string, number>;
  campaignRowsRecreated: number;
  domainEventsRestored: number;
  reviewReopened: string | null;
  canonicalFieldsRestored: string[];
  warnings: string[];
}

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 };
const btn = (primary = false): React.CSSProperties => ({
  padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  border: primary ? 'none' : '1px solid var(--border)',
  background: primary ? 'var(--accent)' : 'var(--surface)',
  color: primary ? '#fff' : 'var(--text-primary)',
});

function describe(report: UndoReport): string[] {
  const lines = [`A ficha "${report.restoredPersonName || 'sem nome'}" volta a existir separada.`];
  lines.push(`${report.aliasesRestored} registro(s) de origem voltam para ela.`);
  const cadastros = report.customersRepointed + report.customersRecreated;
  if (cadastros) lines.push(`${cadastros} cadastro(s) voltam para ela.`);
  const rows = Object.entries(report.rowsRestored).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`);
  if (rows.length) lines.push(`Voltam também: ${rows.join(', ')}.`);
  if (report.campaignRowsRecreated) lines.push(`${report.campaignRowsRecreated} participação(ões) em campanha removidas na junção são recriadas.`);
  if (report.canonicalFieldsRestored.length) lines.push(`Dados da ficha que ficou restaurados: ${report.canonicalFieldsRestored.join(', ')}.`);
  if (report.reviewReopened) lines.push('A revisão que originou a junção volta para a fila.');
  return lines;
}

export default function MergeHistory() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [undoing, setUndoing] = useState<{ item: MergeItem; report: UndoReport } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/identity-merge/history?limit=30&offset=${offset}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Falha ao carregar o histórico.');
      setItems(prev => (offset === 0 ? json.data : [...prev, ...json.data]));
      setTotal(json.total);
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) load(0); }, [open, load]);

  const post = async (body: object) => {
    const res = await fetch('/api/leads/identity-merge/history', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.report as UndoReport;
  };

  const startUndo = async (item: MergeItem) => {
    setBusy(true);
    setMessage(null);
    try {
      setUndoing({ item, report: await post({ action: 'PREVIEW', mergeEventId: item.id }) });
      setReason('');
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const confirmUndo = async () => {
    if (!undoing) return;
    setBusy(true);
    try {
      await post({ action: 'UNDO', mergeEventId: undoing.item.id, reason });
      setMessage({ text: 'Junção desfeita e registrada no histórico.' });
      setUndoing(null);
      await load(0);
    } catch (err: any) {
      setMessage({ text: err.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
      <button type="button" style={{ ...btn(), alignSelf: 'flex-start' }} onClick={() => setOpen(o => !o)}>
        {open ? '▾' : '▸'} 🕘 Histórico de junções (desfazer)
      </button>
      {!open ? null : (
        <>
          {message && <div style={{ ...card, fontSize: 12, color: message.error ? 'var(--danger, #e5484d)' : 'var(--text-primary)' }}>{message.text}</div>}

          {undoing && (
            <div style={{ ...card, border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Desfazer: {undoing.item.kept.fullName || 'Sem nome'} ⟵ {undoing.item.absorbed.fullName || 'Sem nome'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {describe(undoing.report).map(line => <div key={line}>• {line}</div>)}
                {undoing.report.warnings.map(w => <div key={w} style={{ color: 'var(--text-muted)' }}>⚠️ {w}</div>)}
              </div>
              <label style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Motivo (fica registrado no histórico)
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex.: eram pessoas diferentes com o mesmo e-mail da clínica"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-raised, var(--surface))', color: 'var(--text-primary)' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" style={btn()} disabled={busy} onClick={() => setUndoing(null)}>Cancelar</button>
                <button type="button" style={btn(true)} disabled={busy || reason.trim().length < 5} onClick={confirmUndo}>
                  {busy ? 'Desfazendo…' : 'Confirmar desfazer'}
                </button>
              </div>
            </div>
          )}

          {!loading && items.length === 0 && <div style={{ ...card, fontSize: 12, color: 'var(--text-muted)' }}>Nenhuma junção registrada.</div>}

          {items.map(item => (
            <div key={item.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.kept.fullName || 'Sem nome'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>⟵ absorveu</span> {item.absorbed.fullName || 'Sem nome'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleString('pt-BR')} · {item.decidedBy || 'sistema'} · {item.reason}
                </div>
                {item.undone && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    ↩ Desfeita em {new Date(item.undone.at).toLocaleString('pt-BR')} por {item.undone.byName || '—'}: “{item.undone.reason}”
                  </div>
                )}
              </div>
              {item.canUndo && (
                <button type="button" style={btn()} disabled={busy} onClick={() => startUndo(item)}>↩ Desfazer…</button>
              )}
              {!item.canUndo && !item.undone && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Junção antiga: sem registro para desfazer</span>
              )}
            </div>
          ))}

          {items.length < total && (
            <button type="button" style={{ ...btn(), alignSelf: 'center' }} disabled={loading} onClick={() => load(items.length)}>
              {loading ? 'Carregando…' : `Carregar mais (${items.length} de ${total})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
