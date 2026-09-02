'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface Pipeline {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Journey {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
}

interface FormField {
  id?: string;
  name: string;
  label: string;
  type: string; // text, email, select, checkbox
  options: string[];
  required: boolean;
  order: number;
}

interface Form {
  id: string;
  name: string;
  redirectUrl: string | null;
  successMessage: string | null;
  styleConfig: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontFamily?: string;
    opacity?: number;
    buttonColor?: string;
    buttonHoverColor?: string;
    buttonTextColor?: string;
    inputBgColor?: string;
    buttonOpacity?: number;
    dropShadow?: string;
  };
  pipelineId: string;
  stageId: string | null;
  campaignId: string | null;
  journeyId: string | null;
  productId: string | null;
  assignmentMode: 'POOL' | 'ROUND_ROBIN' | 'FIXED';
  fixedAssigneeId: string | null;
  fields: FormField[];
  createdAt: string;
  pipeline?: { id: string; name: string };
  campaign?: { id: string; name: string } | null;
  journey?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
}

interface Product {
  id: string;
  name: string;
}

interface Props {
  currentUser: any;
  pipelines: Pipeline[];
  campaigns: Campaign[];
  journeys?: Journey[];
  agents?: Agent[];
  products: Product[];
  isTab?: boolean;
}

export default function FormsConfiguratorContent({ currentUser, pipelines, campaigns = [], journeys = [], agents = [], products = [], isTab = false }: Props) {
  const [formsList, setFormsList] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Stages selector linked to selected pipelineId
  const [availableStages, setAvailableStages] = useState<string[]>(['novo_cadastro', 'primeiro_contato', 'em_negociacao', 'ganho', 'perdido']);

  // UI state for custom styling
  const [bgColor, setBgColor] = useState('#1e1e24');
  const [textColor, setTextColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(12);
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState('#2a2a35');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [opacity, setOpacity] = useState(100);
  const [btnColor, setBtnColor] = useState('#a78bfa');
  const [btnTextColor, setBtnTextColor] = useState('#ffffff');
  const [inputBgColor, setInputBgColor] = useState('#2a2a35');
  const [buttonOpacity, setButtonOpacity] = useState(100);
  const [dropShadow, setDropShadow] = useState<string>('none');

  // Copy code feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/forms');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setFormsList(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load forms list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newForm: Form = {
      id: '',
      name: 'Formulário Inbound Elementor',
      redirectUrl: '',
      successMessage: 'Seus dados foram recebidos. Obrigado!',
      styleConfig: {
        backgroundColor: '#1e1e24',
        textColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2a2a35',
        fontFamily: 'Inter',
        opacity: 100,
        buttonColor: '#a78bfa',
        buttonTextColor: '#ffffff',
        inputBgColor: '#2a2a35',
        buttonOpacity: 100,
        dropShadow: 'none'
      },
      pipelineId: pipelines[0]?.id || '',
      stageId: 'novo_cadastro',
      campaignId: null,
      journeyId: null,
      productId: null,
      assignmentMode: 'POOL',
      fixedAssigneeId: null,
      fields: [
        { name: 'name', label: 'Nome Completo', type: 'text', options: [], required: true, order: 0 },
        { name: 'email', label: 'E-mail Comercial', type: 'email', options: [], required: true, order: 1 },
        { name: 'phone', label: 'WhatsApp', type: 'text', options: [], required: true, order: 2 }
      ],
      createdAt: new Date().toISOString()
    };
    
    // Reset styling controls
    setBgColor('#1e1e24');
    setTextColor('#ffffff');
    setBorderRadius(12);
    setBorderWidth(1);
    setBorderColor('#2a2a35');
    setFontFamily('Inter');
    setOpacity(100);
    setBtnColor('#a78bfa');
    setBtnTextColor('#ffffff');
    setInputBgColor('#2a2a35');
    setButtonOpacity(100);
    setDropShadow('none');

    setActiveForm(newForm);
    setShowEditor(true);
  };

  const handleEdit = (form: Form) => {
    setActiveForm(form);
    
    // Load existing styles or set defaults
    const cfg = form.styleConfig || {};
    setBgColor(cfg.backgroundColor || '#1e1e24');
    setTextColor(cfg.textColor || '#ffffff');
    setBorderRadius(cfg.borderRadius !== undefined ? cfg.borderRadius : 12);
    setBorderWidth(cfg.borderWidth !== undefined ? cfg.borderWidth : 1);
    setBorderColor(cfg.borderColor || '#2a2a35');
    setFontFamily(cfg.fontFamily || 'Inter');
    setOpacity(cfg.opacity !== undefined ? cfg.opacity : 100);
    setBtnColor(cfg.buttonColor || '#a78bfa');
    setBtnTextColor(cfg.buttonTextColor || '#ffffff');
    setInputBgColor(cfg.inputBgColor || '#2a2a35');
    setButtonOpacity(cfg.buttonOpacity !== undefined ? cfg.buttonOpacity : 100);
    setDropShadow(cfg.dropShadow || 'none');

    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este formulário? Isso impedirá novas capturas externas!')) return;
    try {
      const res = await fetch(`/api/forms?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchForms();
        if (activeForm?.id === id) {
          setActiveForm(null);
          setShowEditor(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!activeForm || !activeForm.name || !activeForm.pipelineId) {
      alert('Nome e Funil de destino são obrigatórios.');
      return;
    }
    if (activeForm.assignmentMode === 'FIXED' && !activeForm.fixedAssigneeId) {
      alert('Selecione o operador fixo.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...activeForm,
        styleConfig: {
          backgroundColor: bgColor,
          textColor,
          borderRadius,
          borderWidth,
          borderColor,
          fontFamily,
          opacity,
          buttonColor: btnColor,
          buttonTextColor: btnTextColor,
          inputBgColor,
          buttonOpacity,
          dropShadow
        }
      };

      const method = activeForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/forms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          fetchForms();
          handleEdit(json.data);
          alert('Configuração de formulário salva com sucesso!');
        } else {
          alert('Erro ao salvar: ' + json.error);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar formulário.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = () => {
    if (!activeForm) return;
    const newField: FormField = {
      name: `custom_field_${activeForm.fields.length + 1}`,
      label: 'Novo Campo',
      type: 'text',
      options: [],
      required: false,
      order: activeForm.fields.length
    };
    setActiveForm({
      ...activeForm,
      fields: [...activeForm.fields, newField]
    });
  };

  const handleRemoveField = (index: number) => {
    if (!activeForm) return;
    const updatedFields = [...activeForm.fields];
    updatedFields.splice(index, 1);
    // Recalculate orders
    const cleanFields = updatedFields.map((f, i) => ({ ...f, order: i }));
    setActiveForm({
      ...activeForm,
      fields: cleanFields
    });
  };

  const handleFieldChange = (index: number, key: keyof FormField, value: any) => {
    if (!activeForm) return;
    const updatedFields = [...activeForm.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [key]: value
    } as any;
    setActiveForm({
      ...activeForm,
      fields: updatedFields
    });
  };

  const SHADOW_MAP: Record<string, string> = {
    none: 'none',
    sm: '0 2px 4px rgba(0, 0, 0, 0.15)',
    md: '0 8px 16px rgba(0, 0, 0, 0.25)',
    lg: '0 16px 32px rgba(0, 0, 0, 0.35)',
    neon: `0 0 20px ${btnColor}60`
  };

  // Generate copyable element code snippet
  const generateSnippet = () => {
    if (!activeForm || !activeForm.id) return 'Salve o formulário para gerar o código de incorporação.';

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    // Styling attributes
    const shadowStyle = SHADOW_MAP[dropShadow] || 'none';
    const containerStyle = `background-color: ${bgColor}; color: ${textColor}; padding: 24px; border: ${borderWidth}px solid ${borderColor}; border-radius: ${borderRadius}px; font-family: ${fontFamily}, sans-serif; opacity: ${opacity / 100}; max-width: 450px; margin: 0 auto; box-sizing: border-box; box-shadow: ${shadowStyle};`;
    const inputStyle = `width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid ${borderColor}; border-radius: 6px; background-color: ${inputBgColor}; color: ${textColor}; outline: none; box-sizing: border-box; font-size: 14px;`;
    const labelStyle = `font-size: 12px; font-weight: 600; color: ${textColor}; opacity: 0.85; margin-bottom: 4px; display: block;`;
    const buttonStyle = `width: 100%; padding: 12px; margin-top: 8px; border: none; border-radius: 6px; background-color: ${btnColor}; color: ${btnTextColor}; font-size: 14px; font-weight: 700; cursor: pointer; transition: background-color 0.2s; opacity: ${buttonOpacity / 100};`;

    const fieldsHtml = activeForm.fields.map(f => {
      const requiredAttr = f.required ? 'required' : '';
      if (f.type === 'select') {
        const optHtml = (f.options || []).map(o => `<option value="${o}" style="background-color: ${bgColor};">${o}</option>`).join('\n          ');
        return `
      <div style="margin-bottom: 16px;">
        <label style="${labelStyle}">${f.label}</label>
        <select name="${f.name}" ${requiredAttr} style="${inputStyle}">
          <option value="" disabled selected style="color: ${textColor}80;">Selecione uma opção...</option>
          ${optHtml}
        </select>
      </div>`;
      } else if (f.type === 'checkbox') {
        return `
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" name="${f.name}" id="field-${f.name}" ${requiredAttr} style="width: 16px; height: 16px; cursor: pointer;" />
        <label for="field-${f.name}" style="font-size: 13px; color: ${textColor}; opacity: 0.9; cursor: pointer;">${f.label}</label>
      </div>`;
      } else {
        return `
      <div style="margin-bottom: 16px;">
        <label style="${labelStyle}">${f.label}</label>
        <input type="${f.type}" name="${f.name}" placeholder="Digite aqui..." ${requiredAttr} style="${inputStyle}" />
      </div>`;
      }
    }).join('');

    return `<!-- Form de Captura Inbound DentalGO CRM -->
<div id="dg-form-container-${activeForm.id}" style="${containerStyle}">
  <form id="dg-form-${activeForm.id}" style="display: flex; flex-direction: column;">
    ${fieldsHtml}
    <button type="submit" style="${buttonStyle}">Enviar Formulário</button>
  </form>
  <div id="dg-success-${activeForm.id}" style="display: none; padding: 16px; text-align: center; font-size: 14px; font-weight: 600; line-height: 1.5;">
    ${activeForm.successMessage || 'Formulário enviado com sucesso!'}
  </div>
</div>

<script>
(function() {
  const form = document.getElementById('dg-form-${activeForm.id}');
  const successMsg = document.getElementById('dg-success-${activeForm.id}');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Captura de parâmetros UTM e cookies de marketing de forma dinâmica
      const urlParams = new URLSearchParams(window.location.search);
      const utms = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content'),
        fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
        fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        page_url: window.location.href,
        referrer: document.referrer || null
      };
      
      const formData = new FormData(form);
      const data = {
        formId: "${activeForm.id}",
        ...utms
      };
      
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      fetch('${baseUrl}/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (res.redirectUrl) {
            window.location.href = res.redirectUrl;
          } else {
            form.style.display = 'none';
            successMsg.style.display = 'block';
          }
        } else {
          alert('Erro ao processar: ' + (res.error || 'Erro no envio'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao conectar com o servidor CRM.');
      });
    });
  }
})();
</script>
`;
  };

  const copyToClipboard = () => {
    const code = generateSnippet();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={isTab ? "" : "layout-root"} style={isTab ? { display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', flex: 1, padding: 0, gap: 24 } : { background: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)' }}>
      {/* HEADER */}
      {!isTab && (
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ◀ Voltar ao Dashboard
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              📋 Marketing Hub & Form Builder
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ThemeToggle />
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{currentUser.name} (Admin)</div>
          </div>
        </header>
      )}

      {/* WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT PANEL: LIST */}
        <div style={{ width: 320, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button 
            onClick={handleCreateNew}
            className="btn-action btn-action-purple"
            style={{ width: '100%', padding: '12px', borderRadius: 8, fontWeight: 700 }}
          >
            ➕ Novo Formulário
          </button>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Meus Formulários</h4>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Carregando formulários...</div>
            ) : formsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>Nenhum formulário criado.</div>
            ) : (
              formsList.map(f => (
                <div 
                  key={f.id}
                  onClick={() => handleEdit(f)}
                  style={{
                    padding: 12, background: activeForm?.id === f.id ? 'var(--accent-glow)' : 'var(--surface-raised)',
                    border: activeForm?.id === f.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: activeForm?.id === f.id ? 'var(--accent)' : 'var(--text-primary)' }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Funil: {f.pipeline?.name}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', padding: 4 }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EDITOR (ACTIVE ONLY) */}
        {!showEditor ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--background)' }}>
            <div style={{ fontSize: 48 }}>📋</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Selecione ou Crie um Formulário de Captura</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, textAlign: 'center' }}>
              Crie formulários customizados, estilize o design e copie o código HTML gerado para incorporar em qualquer página Elementor ou WordPress.
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--background)' }}>
            {/* EDITOR CONFIG PANELS (SCROLLABLE) */}
            <div style={{ flex: 1.2, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, borderRight: '1px solid var(--border)' }}>
              
              {/* Seção 1: Informações Gerais */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Configurações Gerais</h3>
                
                <div>
                  <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Nome do Formulário</label>
                  <input 
                    type="text" 
                    value={activeForm?.name || ''} 
                    onChange={(e) => setActiveForm({ ...activeForm!, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: 12 }}>
                  <strong>Tipo fixo: Oportunidade / Desejo.</strong> O envio cria interesse comercial no produto, nunca compra, matrícula ou LTV.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Funil de Destino (Kanban)</label>
                    <select
                      value={activeForm?.pipelineId || ''}
                      onChange={(e) => setActiveForm({ ...activeForm!, pipelineId: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    >
                      {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Estágio Inicial</label>
                    <select
                      value={activeForm?.stageId || 'novo_cadastro'}
                      onChange={(e) => setActiveForm({ ...activeForm!, stageId: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    >
                      <option value="novo_cadastro">Sem Contato</option>
                      <option value="primeiro_contato">Tentativa de Contato</option>
                      <option value="em_negociacao">Negociação</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Campanha de entrada (recomendado)</label>
                    <select
                      value={activeForm?.campaignId || ''}
                      onChange={(e) => setActiveForm({ ...activeForm!, campaignId: e.target.value || null, journeyId: null })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    >
                      <option value="">Nenhuma campanha</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Produto Vinculado</label>
                    <select
                      value={activeForm?.productId || ''}
                      onChange={(e) => setActiveForm({ ...activeForm!, productId: e.target.value || null })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    >
                      <option value="">Nenhum produto</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Distribuição para Operador</label>
                    <select
                      value={activeForm?.assignmentMode || 'POOL'}
                      disabled={!!activeForm?.campaignId}
                      onChange={(e) => setActiveForm({
                        ...activeForm!,
                        assignmentMode: e.target.value as Form['assignmentMode'],
                        fixedAssigneeId: e.target.value === 'FIXED' ? activeForm?.fixedAssigneeId || null : null
                      })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', opacity: activeForm?.campaignId ? 0.55 : 1 }}
                    >
                      <option value="POOL">Pool / sem operador</option>
                      <option value="ROUND_ROBIN">Round-robin automático</option>
                      <option value="FIXED">Operador fixo</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Operador Fixo</label>
                    <select
                      value={activeForm?.fixedAssigneeId || ''}
                      disabled={!!activeForm?.campaignId || activeForm?.assignmentMode !== 'FIXED'}
                      onChange={(e) => setActiveForm({ ...activeForm!, fixedAssigneeId: e.target.value || null })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', opacity: activeForm?.assignmentMode === 'FIXED' ? 1 : 0.55 }}
                    >
                      <option value="">Selecione...</option>
                      {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                    </select>
                  </div>
                </div>

                {!activeForm?.campaignId ? <div>
                  <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Jornada legada (compatibilidade)</label>
                  <select
                    value={activeForm?.journeyId || ''}
                    onChange={(e) => setActiveForm({ ...activeForm!, journeyId: e.target.value || null })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  >
                    <option value="">Nenhuma jornada — somente funil</option>
                    {journeys.map(journey => <option key={journey.id} value={journey.id}>{journey.name}</option>)}
                  </select>
                </div> : <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 10, background: 'var(--accent-glow)', borderRadius: 8 }}>
                  Funil, produto, equipe, distribuição e fluxo serão herdados da campanha selecionada.
                </div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>URL de Redirecionamento (Pós-envio)</label>
                    <input 
                      type="text" 
                      placeholder="https://sua-pagina.com/obrigado"
                      value={activeForm?.redirectUrl || ''} 
                      onChange={(e) => setActiveForm({ ...activeForm!, redirectUrl: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Mensagem de Sucesso (Se sem redirecionamento)</label>
                    <input 
                      type="text" 
                      value={activeForm?.successMessage || ''} 
                      onChange={(e) => setActiveForm({ ...activeForm!, successMessage: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Configuração de Campos */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Campos do Formulário</h3>
                  <button onClick={handleAddField} className="btn-action-sm active">➕ Adicionar Campo</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeForm?.fields.map((f, index) => (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)',
                        padding: 12, borderRadius: 8, border: '1px solid var(--border)' 
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>#{index+1}</span>
                      
                      <div style={{ flex: 1.5 }}>
                        <input 
                          type="text" 
                          placeholder="Chave do campo (ex: email)"
                          value={f.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value.replace(/\s+/g, '_').toLowerCase())}
                          style={{ width: '100%', padding: '6px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </div>
                      
                      <div style={{ flex: 2 }}>
                        <input 
                          type="text" 
                          placeholder="Label visual (ex: Seu E-mail)"
                          value={f.label}
                          onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                        />
                      </div>

                      <div style={{ flex: 1.5 }}>
                        <select
                          value={f.type}
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                        >
                          <option value="text">Texto</option>
                          <option value="email">E-mail</option>
                          <option value="select">Múltipla Escolha</option>
                          <option value="checkbox">Caixa de Seleção (Aceito)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input 
                          type="checkbox" 
                          id={`req-${index}`}
                          checked={f.required} 
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          style={{ width: 14, height: 14 }}
                        />
                        <label htmlFor={`req-${index}`} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Obrigatório</label>
                      </div>

                      <button 
                        onClick={() => handleRemoveField(index)}
                        style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 14 }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 3: Editor de Design Visual */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Estilo e Aparência</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor de Fundo (Formulário)</label>
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor do Texto (Letra/Label)</label>
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor do Fundo dos Inputs</label>
                    <input 
                      type="color" 
                      value={inputBgColor} 
                      onChange={(e) => setInputBgColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor da Borda</label>
                    <input 
                      type="color" 
                      value={borderColor} 
                      onChange={(e) => setBorderColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor do Botão de Envio</label>
                    <input 
                      type="color" 
                      value={btnColor} 
                      onChange={(e) => setBtnColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Cor do Texto do Botão</label>
                    <input 
                      type="color" 
                      value={btnTextColor} 
                      onChange={(e) => setBtnTextColor(e.target.value)}
                      style={{ width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Sombra Projetada (Shadow)</label>
                    <select
                      value={dropShadow}
                      onChange={(e) => setDropShadow(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="none">Nenhuma</option>
                      <option value="sm">Suave (Pequena)</option>
                      <option value="md">Média</option>
                      <option value="lg">Chativa (Grande)</option>
                      <option value="neon">Neon Glow (Brilho)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Tipografia (Fonte)</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Outfit">Outfit</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Arredondamento das Bordas ({borderRadius}px)</label>
                    <input 
                      type="range" min="0" max="30" 
                      value={borderRadius} 
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Largura da Borda ({borderWidth}px)</label>
                    <input 
                      type="range" min="0" max="5" 
                      value={borderWidth} 
                      onChange={(e) => setBorderWidth(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Transparência Geral ({opacity}%)</label>
                    <input 
                      type="range" min="10" max="100" 
                      value={opacity} 
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="label-sm" style={{ marginBottom: 6, display: 'block' }}>Transparência do Botão ({buttonOpacity}%)</label>
                    <input 
                      type="range" min="10" max="100" 
                      value={buttonOpacity} 
                      onChange={(e) => setButtonOpacity(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="btn-action btn-action-purple"
                  style={{ flex: 1, padding: 14, borderRadius: 8, fontWeight: 700 }}
                >
                  {saving ? 'Salvando...' : '💾 Salvar Formulário'}
                </button>
              </div>

            </div>

            {/* PREVIEW PANEL & EMBED GENERATOR */}
            <div style={{ flex: 1, padding: 24, background: 'var(--surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Preview */}
              <div className="card" style={{ background: 'var(--background)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase' }}>Visualização em Tempo Real (Preview)</h3>
                
                <div style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  padding: 24,
                  border: `${borderWidth}px solid ${borderColor}`,
                  borderRadius: `${borderRadius}px`,
                  fontFamily: `${fontFamily}, sans-serif`,
                  opacity: opacity / 100,
                  maxWidth: 400,
                  margin: '0 auto',
                  boxShadow: SHADOW_MAP[dropShadow] || 'none'
                }}>
                  <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(activeForm?.fields || []).map((f, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {f.type !== 'checkbox' && (
                          <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                            {f.label} {f.required && <span style={{ color: '#F87171' }}>*</span>}
                          </label>
                        )}
                        
                        {f.type === 'select' ? (
                          <select style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBgColor, color: textColor }}>
                            <option value="">Selecione...</option>
                          </select>
                        ) : f.type === 'checkbox' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" id={`prev-check-${i}`} style={{ width: 16, height: 16 }} />
                            <label htmlFor={`prev-check-${i}`} style={{ fontSize: 12 }}>{f.label}</label>
                          </div>
                        ) : (
                          <input 
                            type={f.type} 
                            placeholder={`Digite seu ${f.label.toLowerCase()}...`}
                            disabled
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBgColor, color: textColor }}
                          />
                        )}
                      </div>
                    ))}
                    
                    <button 
                      style={{ 
                        width: '100%', padding: 12, border: 'none', borderRadius: 6,
                        backgroundColor: btnColor, color: btnTextColor, fontWeight: 700,
                        fontSize: 14, opacity: buttonOpacity / 100
                      }}
                    >
                      Enviar Formulário
                    </button>
                  </form>
                </div>
              </div>

              {/* Snippet Code copy generator */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Código de Incorporação (HTML Snippet)</h3>
                  
                  {activeForm?.id && (
                    <button 
                      onClick={copyToClipboard}
                      className="btn-action-sm active"
                    >
                      {copied ? '✅ Copiado!' : '📋 Copiar Código'}
                    </button>
                  )}
                </div>

                {!activeForm?.id ? (
                  <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    Salve o formulário primeiro para gerar o snippet de inclusão para WordPress/Elementor.
                  </div>
                ) : (
                  <pre style={{
                    padding: 16, background: 'var(--background)', border: '1px solid var(--border)',
                    borderRadius: 8, overflowX: 'auto', fontSize: 11, color: 'var(--text-primary)',
                    maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                  }}>
                    <code>{generateSnippet()}</code>
                  </pre>
                )}
                
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(167, 139, 250, 0.05)', border: '1px solid var(--accent-light)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  💡 <strong>Como incorporar no Elementor:</strong> Cole o código acima dentro de um bloco de código <strong>HTML</strong> no WordPress. O script embutido gerenciará a captura e injetará as UTMs de marketing automaticamente!
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
