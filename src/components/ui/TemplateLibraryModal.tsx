'use client';

import { useState, useEffect } from 'react';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: () => void; // Callback to refresh templates in parent
}

export default function TemplateLibraryModal({ isOpen, onClose, onTemplateCreated }: TemplateLibraryModalProps) {
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  const [tplId, setTplId] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplType, setTplType] = useState('EMAIL'); // EMAIL | WHATSAPP
  const [tplLang, setTplLang] = useState('PT'); // PT | EN | ES
  const [tplSubject, setTplSubject] = useState('');
  const [tplContent, setTplContent] = useState('');

  const fetchTemplatesList = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/settings/templates');
      if (res.ok) {
        const json = await res.json();
        setTemplatesList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplatesList();
    }
  }, [isOpen]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tplId || undefined,
          name: tplName,
          description: tplDesc,
          type: tplType,
          language: tplLang,
          subject: tplType === 'EMAIL' ? tplSubject : undefined,
          content: tplContent
        })
      });
      if (res.ok) {
        setTplId('');
        setTplName('');
        setTplDesc('');
        setTplType('EMAIL');
        setTplLang('PT');
        setTplSubject('');
        setTplContent('');
        fetchTemplatesList();
        if (onTemplateCreated) onTemplateCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Deseja excluir este template?')) return;
    try {
      const res = await fetch(`/api/settings/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplatesList();
        if (onTemplateCreated) onTemplateCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--surface)',
        width: '900px', maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto',
        borderRadius: 12, border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: 20, borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            📚 Biblioteca de Templates
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            fontSize: 20, cursor: 'pointer'
          }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Creator Form */}
          <form onSubmit={handleSaveTemplate} style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              {tplId ? '✏️ Editar Template' : '✨ Novo Template'}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Nome do Template:</label>
                <input
                  type="text" required value={tplName} onChange={(e) => setTplName(e.target.value)}
                  placeholder="Ex: Boas-vindas Premium"
                  style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                />
              </div>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Tipo:</label>
                <select value={tplType} onChange={(e) => setTplType(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}>
                  <option value="EMAIL">E-mail</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Idioma:</label>
                <select value={tplLang} onChange={(e) => setTplLang(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}>
                  <option value="PT">Português (BR)</option>
                  <option value="EN">Inglês (US)</option>
                  <option value="ES">Espanhol</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Descrição Interna (Opcional):</label>
              <input
                type="text" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)}
                placeholder="Ex: Usado na régua de carrinho abandonado."
                style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
              />
            </div>

            {tplType === 'EMAIL' && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Assunto do E-mail:</label>
                <input
                  type="text" required value={tplSubject} onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="Ex: Você deixou algo no carrinho!"
                  style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                />
              </div>
            )}

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Conteúdo do Template:</label>
              <textarea
                required value={tplContent} onChange={(e) => setTplContent(e.target.value)}
                placeholder="Olá {{nome}}, tudo bem?"
                style={{ width: '100%', minHeight: 120, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              {tplId && (
                <button
                  type="button"
                  onClick={() => {
                    setTplId('');
                    setTplName('');
                    setTplDesc('');
                    setTplType('EMAIL');
                    setTplSubject('');
                    setTplContent('');
                  }}
                  className="btn-action"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn-action">
                💾 {tplId ? 'Atualizar' : 'Salvar Template'}
              </button>
            </div>
          </form>

          {/* Template List */}
          <div style={{ background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {loadingTemplates ? (
              <div className="label-sm" style={{ padding: 20, textAlign: 'center' }}>Carregando templates...</div>
            ) : templatesList.length === 0 ? (
              <div className="label-sm" style={{ padding: 20, textAlign: 'center' }}>Nenhum template cadastrado.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Nome</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {templatesList.map((tpl) => (
                    <tr key={tpl.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)' }}>
                        <div style={{ fontWeight: 600 }}>{tpl.name}</div>
                        {tpl.description && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tpl.description}</div>}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {tpl.type === 'WHATSAPP' ? '💬 WhatsApp' : '📧 E-mail'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setTplId(tpl.id);
                              setTplName(tpl.name);
                              setTplDesc(tpl.description || '');
                              setTplType(tpl.type);
                              setTplLang(tpl.language);
                              setTplSubject(tpl.subject || '');
                              setTplContent(tpl.content);
                            }}
                            style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 10, cursor: 'pointer' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--red)', fontSize: 10, cursor: 'pointer' }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
