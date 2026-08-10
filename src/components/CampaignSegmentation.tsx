'use client';

import React, { useState, useEffect } from 'react';

export interface CampaignRule {
  id: string;
  dimension: 'lead_source' | 'product_acquired' | 'product_status';
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
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

  // Fetch Inbound Forms list for Dimension 1 "Origem do Lead"
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

  // Add a new empty rule
  const handleAddRule = () => {
    const newRule: CampaignRule = {
      id: crypto.randomUUID(),
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
        } else if (updates.dimension === 'product_acquired') {
          nextRule.operator = 'equals';
          nextRule.value = productsList[0]?.id || '';
        } else if (updates.dimension === 'product_status') {
          nextRule.operator = 'equals';
          nextRule.value = 'ACTIVE';
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-fadeUp">
      {/* Left side: Rules Query Builder */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Campaign Info Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Nome da Campanha:
            </label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Ex: Campanha Resgate Congresso DentalPress"
              className="w-full px-4 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Data de Início:
            </label>
            <input
              type="date"
              required
              value={campaignStartDate}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Query Builder Container */}
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
            <div>
              <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
                Segmentação de Leads (Filtros Lógicos)
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Defina as regras dinâmicas que os leads devem cumprir para entrar nesta campanha.
              </p>
            </div>
            {rules.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)] font-medium">Combinar regras por:</span>
                <button
                  type="button"
                  onClick={handleToggleRelation}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-[var(--accent)] text-white shadow hover:scale-105 transition-all"
                >
                  {rulesRelation === 'AND' ? 'TODAS (E)' : 'QUALQUER (OU)'}
                </button>
              </div>
            )}
          </div>

          {/* Rules List */}
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-[var(--border)] rounded-xl bg-black/5 dark:bg-white/[0.02]">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-sm font-medium text-[var(--text-secondary)] text-center">
                Nenhuma regra de segmentação adicionada.
              </p>
              <p className="text-xs text-[var(--text-faint)] text-center mt-1">
                Adicione regras para refinar e filtrar a base de leads da campanha.
              </p>
              <button
                type="button"
                onClick={handleAddRule}
                className="mt-4 px-4 py-2 bg-[var(--accent)] text-white font-semibold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>+</span> Adicionar Primeira Regra
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rules.map((rule, index) => (
                <React.Fragment key={rule.id}>
                  {/* Connector line between rules */}
                  {index > 0 && (
                    <div className="flex justify-center -my-1">
                      <button
                        type="button"
                        onClick={handleToggleRelation}
                        className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm hover:bg-[var(--accent)] hover:text-white transition-all z-10"
                      >
                        {rulesRelation === 'AND' ? 'E' : 'OU'}
                      </button>
                    </div>
                  )}

                  {/* Rule Row Card */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.01] border border-[var(--border)] rounded-xl hover:border-[var(--accent-light)] transition-all group relative">
                    
                    {/* Dimension Select */}
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={rule.dimension}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, {
                            dimension: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                      >
                        <option value="lead_source">Origem do Lead</option>
                        <option value="product_acquired">Produto Adquirido</option>
                        <option value="product_status">Status do Produto</option>
                      </select>
                    </div>

                    {/* Operator Select */}
                    <div className="w-full md:w-[130px]">
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, {
                            operator: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                      >
                        <option value="equals">É igual a</option>
                        <option value="not_equals">Não é igual a</option>
                        {rule.dimension !== 'product_status' && (
                          <option value="contains">Contém</option>
                        )}
                      </select>
                    </div>

                    {/* Value Input/Select */}
                    <div className="flex-[1.5] min-w-[200px]">
                      {rule.dimension === 'lead_source' ? (
                        <select
                          value={rule.value}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { value: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                        >
                          <option value="CSV">📥 Upload/Importação CSV</option>
                          {loadingForms ? (
                            <option disabled>Carregando formulários...</option>
                          ) : (
                            formsList.map((form) => (
                              <option
                                key={form.id}
                                value={`Form Capture: ${form.name}`}
                              >
                                📝 Formulário: {form.name}
                              </option>
                            ))
                          )}
                        </select>
                      ) : rule.dimension === 'product_acquired' ? (
                        <select
                          value={rule.value}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { value: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                        >
                          {productsList.length === 0 ? (
                            <option disabled>Nenhum produto cadastrado</option>
                          ) : (
                            productsList.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                🏷️ {prod.name}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <select
                          value={rule.value}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { value: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                        >
                          <option value="ACTIVE">🟢 Assinatura Ativa (ACTIVE)</option>
                          <option value="EXPIRED">🟡 Assinatura Expirada (EXPIRED)</option>
                          <option value="CANCELED">🔴 Assinatura Cancelada (CANCELED)</option>
                          <option value="COMPLETED">🔵 Assinatura Concluída (COMPLETED)</option>
                        </select>
                      )}
                    </div>

                    {/* Delete Rule Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition-all self-end md:self-center"
                      title="Excluir regra"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                </React.Fragment>
              ))}

              {/* Add Rule Button at the end */}
              <div className="flex justify-start mt-2">
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3.5 py-1.5 bg-black/5 dark:bg-white/5 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <span>+</span> Adicionar Regra
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nurturing exclusion checkbox */}
        <div className="flex items-center gap-3 bg-[var(--surface-raised)] p-3.5 border border-[var(--border)] rounded-xl shadow-sm">
          <input
            type="checkbox"
            id="excludeNurturing"
            checked={excludeNurturing}
            onChange={(e) => onChangeExcludeNurturing(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-[var(--accent)] rounded border-[var(--border)] bg-transparent focus:ring-0"
          />
          <label
            htmlFor="excludeNurturing"
            className="text-xs cursor-pointer text-[var(--text-primary)] leading-normal flex items-center gap-1.5 font-medium select-none"
          >
            <span>⚠️</span>
            <span>
              <strong>Ignorar leads em esteira de recuperação/nutrição</strong> (Evita sobreposição de mensagens)
            </span>
          </label>
        </div>

      </div>

      {/* Right side: Estimated Audience */}
      <div className="w-full lg:w-[280px] bg-gradient-to-br from-[rgba(var(--accent-rgb),0.05)] to-transparent border border-[var(--accent-light)] rounded-2xl p-6 flex flex-col justify-center items-center text-center self-stretch min-h-[220px]">
        <div className="text-4xl mb-3 animate-pulse">🎯</div>
        <h4 className="font-extrabold text-sm text-[var(--text-primary)] mb-1">
          Público-Alvo Estimado
        </h4>
        
        {loadingEstimate ? (
          <div className="h-9 w-24 bg-[var(--border)] rounded-lg animate-pulse my-2"></div>
        ) : (
          <div className="text-3xl font-black text-[var(--accent)] my-2 tracking-tight">
            {estimatedAudience.toLocaleString()}
          </div>
        )}
        
        <p className="text-xs text-[var(--text-secondary)] max-w-[200px] leading-relaxed">
          leads atendem às regras lógicas configuradas ao lado.
        </p>

        {collisionCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 p-3 rounded-xl text-[10px] leading-relaxed flex gap-2.5 mt-4 text-left">
            <span className="text-xs">⚠️</span>
            <div>
              <strong>Atenção:</strong> {collisionCount} leads desta lista já estão ativos em outras jornadas. Mantenha a opção de <strong>ignorar leads em esteira</strong> ativa para evitar contatos duplicados.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
