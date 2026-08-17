'use client';

import { useState, useEffect, useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface VisualAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  journeyId: string;
}

export default function VisualAuditorModal({ isOpen, onClose, customerId, journeyId }: VisualAuditorModalProps) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchAuditorData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/campaigns/auditor?customerId=${customerId}&journeyId=${journeyId}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setError(data.error || 'Erro ao carregar auditoria do fluxo.');
          return;
        }

        const { journey, interactions } = data;
        let flowGraph = { nodes: [], edges: [] };
        
        try {
          if (journey.flowGraph) {
            flowGraph = JSON.parse(journey.flowGraph);
          }
        } catch (e) {
          console.error('Error parsing flowGraph', e);
        }

        const automations = journey.automations || [];
        
        // Map interactions to reactflowNodeId
        const nodeStatusMap: Record<string, string> = {};
        
        automations.forEach((auto: any) => {
          if (auto.reactflowNodeId) {
            // Find the interaction for this automation
            const interaction = interactions.find((i: any) => i.automationId === auto.id);
            if (interaction) {
              nodeStatusMap[auto.reactflowNodeId] = interaction.deliveryStatus; // 'SENT' or 'FAILED'
            } else {
              nodeStatusMap[auto.reactflowNodeId] = 'PENDING';
            }
          }
        });

        // Colorize the nodes based on status
        const coloredNodes = flowGraph.nodes.map((node: any) => {
          if (node.id === 'start') {
            return {
              ...node,
              style: { ...node.style, border: '2px solid var(--accent)', background: 'var(--surface)' }
            };
          }

          const status = nodeStatusMap[node.id];
          let borderColor = 'var(--border)';
          let bgColor = 'var(--surface)';
          let statusText = '⏳ Na Fila';

          if (status === 'SENT') {
            borderColor = 'var(--green)';
            bgColor = 'var(--green-light)';
            statusText = '✅ Enviado';
          } else if (status === 'FAILED') {
            borderColor = 'var(--red)';
            bgColor = 'var(--red-light)';
            statusText = '❌ Falhou';
          } else if (status === 'PENDING') {
            borderColor = 'var(--orange)';
            bgColor = 'var(--surface-raised)';
            statusText = '⏳ Pendente / Fila';
          }

          return {
            ...node,
            style: { 
              ...node.style, 
              border: `2px solid ${borderColor}`,
              background: bgColor,
              opacity: status ? 1 : 0.6
            },
            data: {
              ...node.data,
              label: (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {node.data.label}
                  {status && (
                    <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: borderColor }}>
                      {statusText}
                    </div>
                  )}
                </div>
              )
            }
          };
        });

        setNodes(coloredNodes);
        setEdges(flowGraph.edges || []);

      } catch (err) {
        console.error(err);
        setError('Falha de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditorData();
  }, [isOpen, customerId, journeyId]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-scaleUp" style={{ width: '90vw', height: '90vh', background: 'var(--surface)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>👁️ Auditoria Visual da Jornada</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visualize exatamente por onde o lead passou e o status de cada disparo.</p>
          </div>
          <button onClick={onClose} className="btn-action btn-action-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
            Fechar
          </button>
        </div>

        {/* Canvas Body */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--background)' }}>
          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
              Carregando auditoria do fluxo...
            </div>
          ) : error ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
              {error}
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
