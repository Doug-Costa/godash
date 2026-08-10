'use client';

import React, { useState, useEffect } from 'react';

export interface CampaignRule {
  id: string;
  dimension: 'lead_source' | 'dentalgo_subscription' | 'congresso' | 'curso';
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  utmSource?: string;
}

interface CampaignSegmentationProps {
  campaignName: string;
  onChangeName: (name: string) => void;
  campaignStartDate: string;
  onChangeStartDate: (date: string) => void;
  rules: CampaignRule[];
  onChangeRules: (rules: CampaignRule[]) => void;
  rulesRelation: 'AND' | 'OR';
  onChangeRelation: (relation: 'AND' | 'OR') => void;
  excludeNurturing: boolean;
  onChangeExcludeNurturing: (exclude: boolean) => void;
  estimatedAudience: number;
  collisionCount: number;
  loadingEstimate: boolean;
  productsList: any[];
}

export default function CampaignSegmentation({
  campaignName,
  onChangeName,
  campaignStartDate,
  onChangeStartDate,
  rules,
  onChangeRules,
  rulesRelation,
  onChangeRelation,
  excludeNurturing,
  onChangeExcludeNurturing,
  estimatedAudience,
  collisionCount,
  loadingEstimate,
  productsList,
}: CampaignSegmentationProps) {
  const [formsList, setFormsList] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);

  // Fetch Inbound Forms list for Dimension 1 "Origem do Lead" -> Forms Site
  useEffect(() => {
    const fetchForms = async () => {
      setLoadingForms(true);
      try {
        const res = await fetch('/api/forms');
        if (res.ok) {
          const data = await res.json();
          setFormsList(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch forms:', err);
      } finally {
        setLoadingForms(false);
      }
    };
    fetchForms();
  }, []);

  // Filtered lists of products by category
  const saasProducts = productsList.filter(
    (p) => p.category === 'SAAS' || p.name.toLowerCase().includes('dentalgo')
  );
  const congressProducts = productsList.filter(
    (p) => p.category === 'CONGRESSO' || p.name.toLowerCase().includes('congresso')
  );
  const courseProducts = productsList.filter(
    (p) => p.category === 'CURSO' || p.name.toLowerCase().includes('curso')
  );

  // Add a new empty rule
  const handleAddRule = () => {
    const newRule: CampaignRule = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      dimension: 'lead_source',
      operator: 'equals',
      value: 'CSV',
    };
    onChangeRules([...rules, newRule]);
  };

  // Remove a rule
  const handleRemoveRule = (id: string) => {
    onChangeRules(rules.filter((rule) => rule.id !== id));
  };

  // Update a specific rule field
  const handleUpdateRule = (id: string, updates: Partial<CampaignRule>) => {
    const updated = rules.map((rule) => {
      if (rule.id !== id) return rule;
      const nextRule = { ...rule, ...updates };

      // Adjust defaults when dimension changes
      if (updates.dimension) {
        if (updates.dimension === 'lead_source') {
          nextRule.operator = 'equals';
          nextRule.value = 'CSV';
          delete nextRule.status;
          delete nextRule.startDate;
          delete nextRule.endDate;
          delete nextRule.utmSource;
        } else if (updates.dimension === 'dentalgo_subscription') {
          nextRule.operator = 'equals';
          nextRule.value = saasProducts[0]?.id || '';
          nextRule.status = 'ACTIVE';
          nextRule.startDate = '';
          nextRule.endDate = '';
          delete nextRule.utmSource;
        } else if (updates.dimension === 'congresso') {
          nextRule.operator = 'equals';
          nextRule.value = congressProducts[0]?.id || '';
          delete nextRule.status;
          delete nextRule.startDate;
          delete nextRule.endDate;
          delete nextRule.utmSource;
        } else if (updates.dimension === 'curso') {
          nextRule.operator = 'equals';
          nextRule.value = courseProducts[0]?.id || '';
          delete nextRule.status;
          delete nextRule.startDate;
          delete nextRule.endDate;
          delete nextRule.utmSource;
        }
      }

      // Reset values if sub-dimension choices change
      if (updates.value && rule.dimension === 'lead_source') {
        if (updates.value === 'FORM') {
          nextRule.utmSource = '';
          nextRule.value = formsList[0] ? `Form Capture: ${formsList[0].name}` : '';
        } else {
          delete nextRule.utmSource;
        }
      }

      return nextRule;
    });
    onChangeRules(updated);
  };

  // Toggle relations globally
  const handleToggleRelation = () => {
    onChangeRelation(rulesRelation === 'AND' ? 'OR' : 'AND');
  };

  // Perform date consistency checks
  const dateErrors = rules.map((rule) => {
    if (rule.dimension === 'dentalgo_subscription' && rule.startDate && rule.endDate) {
      if (rule.startDate > rule.endDate) {
        return 'Data inicial não pode ser maior que a data final.';
      }
    }
    return null;
  });

  const hasDateError = dateErrors.some((err) => err !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 24, width: '100%', alignItems: 'flex-start' }}>
      
      {/* Left side: Rules Query Builder */}
      <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Campaign Info Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
              Nome da Campanha:
            </label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Ex: Campanha Resgate Congresso DentalPress"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
              Data de Início:
            </label>
            <input
              type="date"
              required
              value={campaignStartDate}
              onChange={(e) => onChangeStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {/* Query Builder Container */}
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: 12,
          }}>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
                Segmentação de Leads (Filtros Lógicos)
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                Defina as regras dinâmicas que os leads devem cumprir para entrar na campanha.
              </p>
            </div>
            {rules.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Combinar por:</span>
                <button
                  type="button"
                  onClick={handleToggleRelation}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {rulesRelation === 'AND' ? 'TODAS (E)' : 'QUALQUER (OU)'}
                </button>
              </div>
            )}
          </div>

          {/* Rules List */}
          {rules.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              border: '1px dashed var(--border)',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.02)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 32, marginBottom: 8 }}>🔍</span>
              <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Nenhuma regra de segmentação adicionada
              </h5>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 16px 0', maxWidth: 280 }}>
                Adicione regras para filtrar a base de clientes da campanha.
              </p>
              <button
                type="button"
                onClick={handleAddRule}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Adicionar Primeira Regra
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rules.map((rule, index) => (
                <React.Fragment key={rule.id}>
                  {/* Connector badge */}
                  {index > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                      <button
                        type="button"
                        onClick={handleToggleRelation}
                        style={{
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'var(--surface-raised)',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        {rulesRelation === 'AND' ? 'E' : 'OU'}
                      </button>
                    </div>
                  )}

                  {/* Rule Row Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: '12px',
                    background: 'rgba(0,0,0,0.01)',
                    border: dateErrors[index] ? '1px solid #EF4444' : '1px solid var(--border)',
                    borderRadius: 8,
                  }}>
                    {/* Top Row: Dimension Selection, Operator/Source type and Remove action */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {/* Dimension Select */}
                      <div style={{ flex: 1.2 }}>
                        <select
                          value={rule.dimension}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              dimension: e.target.value as any,
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            outline: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <option value="lead_source">Origem do Lead</option>
                          <option value="dentalgo_subscription">Assinatura DentalGO</option>
                          <option value="congresso">Participou de Congresso</option>
                          <option value="curso">Realizou Curso</option>
                        </select>
                      </div>

                      {/* Enchained Sub-Filters / Operator */}
                      <div style={{ flex: 1.8, display: 'flex', gap: 8 }}>
                        {rule.dimension === 'lead_source' ? (
                          <select
                            value={rule.value === 'CSV' || rule.value === 'DENTALGO' ? rule.value : 'FORM'}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { value: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          >
                            <option value="CSV">📥 Importação CSV</option>
                            <option value="DENTALGO">🌐 DentalGO Sinc DB</option>
                            <option value="FORM">📝 Formulários Site</option>
                          </select>
                        ) : rule.dimension === 'dentalgo_subscription' ? (
                          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            {/* Product selection (Plans category) */}
                            <select
                              value={rule.value}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, { value: e.target.value })
                              }
                              style={{
                                width: '60%',
                                padding: '8px 10px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                                fontSize: 12,
                                outline: 'none',
                              }}
                            >
                              {saasProducts.length === 0 ? (
                                <option disabled>Nenhum plano cadastrado</option>
                              ) : (
                                saasProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    Plan: {p.name}
                                  </option>
                                ))
                              )}
                            </select>
                            {/* Subscription Status select */}
                            <select
                              value={rule.status || 'ACTIVE'}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, { status: e.target.value })
                              }
                              style={{
                                width: '40%',
                                padding: '8px 10px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                                fontSize: 12,
                                outline: 'none',
                              }}
                            >
                              <option value="ACTIVE">🟢 Ativo</option>
                              <option value="EXPIRED">🟡 Expirado</option>
                              <option value="CANCELED">🔴 Cancelado</option>
                              <option value="COMPLETED">🔵 Concluído</option>
                            </select>
                          </div>
                        ) : (
                          /* Congresso and Curso operator */
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, {
                                operator: e.target.value as any,
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          >
                            <option value="equals">É igual a</option>
                            <option value="not_equals">Não é igual a</option>
                          </select>
                        )}
                      </div>

                      {/* Remove Rule Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule.id)}
                        style={{
                          padding: 8,
                          background: 'none',
                          border: 'none',
                          color: '#F43F5E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                        }}
                        title="Excluir regra"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ width: 16, height: 16 }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Bottom Row: Additional inputs depend on dimension choice */}
                    {rule.dimension === 'lead_source' && rule.value !== 'CSV' && rule.value !== 'DENTALGO' && (
                      <div style={{ display: 'flex', gap: 12, paddingLeft: 4 }}>
                        {/* Forms site select list */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            Selecione o Formulário:
                          </label>
                          <select
                            value={rule.value}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { value: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          >
                            {loadingForms ? (
                              <option disabled>Carregando formulários...</option>
                            ) : formsList.length === 0 ? (
                              <option disabled>Nenhum formulário cadastrado</option>
                            ) : (
                              formsList.map((form) => (
                                <option
                                  key={form.id}
                                  value={`Form Capture: ${form.name}`}
                                >
                                  {form.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        {/* UTM source filter */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            UTM Origem (utm_source):
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: facebook_ads (opcional)"
                            value={rule.utmSource || ''}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { utmSource: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '5px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {rule.dimension === 'dentalgo_subscription' && (
                      <div style={{ display: 'flex', gap: 12, paddingLeft: 4 }}>
                        {/* Start Date */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            Assinatura De:
                          </label>
                          <input
                            type="date"
                            value={rule.startDate || ''}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { startDate: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '5px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          />
                        </div>
                        {/* End Date */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            Assinatura Até:
                          </label>
                          <input
                            type="date"
                            value={rule.endDate || ''}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { endDate: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '5px 10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {rule.dimension === 'congresso' && (
                      <div style={{ paddingLeft: 4 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          Selecione o Congresso:
                        </label>
                        <select
                          value={rule.value}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { value: e.target.value })
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            outline: 'none',
                          }}
                        >
                          {congressProducts.length === 0 ? (
                            <option disabled>Nenhum congresso cadastrado</option>
                          ) : (
                            congressProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                🏆 {p.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {rule.dimension === 'curso' && (
                      <div style={{ paddingLeft: 4 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          Selecione o Curso:
                        </label>
                        <select
                          value={rule.value}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { value: e.target.value })
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            outline: 'none',
                          }}
                        >
                          {courseProducts.length === 0 ? (
                            <option disabled>Nenhum curso cadastrado</option>
                          ) : (
                            courseProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                🎓 {p.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {/* Date inconsistency warnings */}
                    {dateErrors[index] && (
                      <div style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, paddingLeft: 4 }}>
                        ⚠️ {dateErrors[index]}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}

              {/* Add Rule Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleAddRule}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                  }}
                >
                  + Adicionar Regra
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nurturing exclusion checkbox */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-raised)',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          width: '100%',
        }}>
          <input
            type="checkbox"
            id="excludeNurturing"
            checked={excludeNurturing}
            onChange={(e) => onChangeExcludeNurturing(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <label
            htmlFor="excludeNurturing"
            style={{
              fontSize: 12,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              margin: 0,
              fontWeight: 500,
            }}
          >
            ⚠️ <strong>Ignorar leads em esteira de recuperação/nutrição</strong> (Evita sobreposição de mensagens)
          </label>
        </div>

      </div>

      {/* Right side: Estimated Audience */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.05), transparent)',
        border: '1px solid var(--accent-light)',
        borderRadius: 12,
        padding: '24px 16px',
        textAlign: 'center',
        minHeight: 220,
        boxSizing: 'border-box',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
        <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>
          Público-Alvo Estimado
        </h4>
        
        {hasDateError ? (
          <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, margin: '8px 0', lineHeight: 1.3 }}>
            Erro: Datas Inconsistentes
          </div>
        ) : loadingEstimate ? (
          <div style={{
            height: 32,
            width: 100,
            background: 'var(--border)',
            borderRadius: 6,
            animation: 'pulse 1.5s infinite',
            margin: '8px 0',
          }}></div>
        ) : (
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', margin: '8px 0' }}>
            {estimatedAudience}
          </div>
        )}
        
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 180, margin: 0, lineHeight: 1.4 }}>
          {hasDateError ? 'Corrija os erros nas regras para calcular o público estimado.' : 'leads atendem às regras lógicas configuradas ao lado.'}
        </p>

        {collisionCount > 0 && !hasDateError && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#CA8A04',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 10,
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'start',
            gap: 6,
            marginTop: 16,
            textAlign: 'left',
          }}>
            <span>⚠️</span>
            <div>
              <strong>Atenção:</strong> {collisionCount} leads desta lista já estão ativos em outras nutrições. Mantenha a opção de ignorar leads marcada.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
