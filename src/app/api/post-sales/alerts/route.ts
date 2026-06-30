/**
 * GET /api/post-sales/alerts
 *
 * Retorna alertas de Pós-Venda pendentes para o agente logado.
 * Enriquece cada alerta com dados do lead do Banco 1 (Clone MySQL)
 * e renderiza a mensagem com variáveis substituídas.
 *
 * Query params:
 *   ?assignedTo=<userId>  — filtra por agente (admin pode ver todos omitindo)
 *   ?all=true             — retorna todos os PENDING (apenas ADMIN/POST_SALES)
 */

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PrismaPostSaleRepository } from '@/lib/repositories/PrismaPostSaleRepository';
import type { PostSaleAlertDTO } from '@/lib/domain/post-sale.types';

const repo = new PrismaPostSaleRepository();

interface PersonRow {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
}

/** Substitui variáveis de template pela informação real do lead */
function renderMessage(template: string, person: PersonRow, planName?: string): string {
  return template
    .replace(/\{\{nome\}\}/gi, person.fullName || 'Doutor(a)')
    .replace(/\{\{email\}\}/gi, person.email || '')
    .replace(/\{\{telefone\}\}/gi, person.phoneNumber || '')
    .replace(/\{\{plano\}\}/gi, planName || '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get('assignedTo') ?? undefined;
  const showAll    = searchParams.get('all') === 'true';

  try {
    // Busca tarefas pendentes (scheduledFor <= NOW)
    const tasks = await repo.getPendingAlerts(showAll ? undefined : assignedTo);

    if (tasks.length === 0) {
      return NextResponse.json({ success: true, count: 0, alerts: [] });
    }

    // Coleta IDs únicos de pessoas para buscar no Banco 1
    const personIds = [...new Set(tasks.map(t => t.externalPersonId))];

    const placeholders = personIds.map(() => '?').join(',');
    const [personRows] = await pool.query(
      `SELECT id, fullName, email, phoneNumber FROM people WHERE id IN (${placeholders})`,
      personIds
    );
    const people = personRows as PersonRow[];
    const peopleMap = new Map(people.map(p => [p.id, p]));

    // Enriquece os alertas
    const alerts: PostSaleAlertDTO[] = tasks.map(task => {
      const person = peopleMap.get(task.externalPersonId);
      return {
        ...task,
        personFullName:   person?.fullName   ?? `(ID ${task.externalPersonId})`,
        personEmail:      person?.email      ?? '',
        personPhone:      person?.phoneNumber ?? '',
        renderedMessage: person
          ? renderMessage(task.templateMessage, person, task.snapshotPlanName ?? undefined)
          : task.templateMessage,
      };
    });

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[post-sales/alerts] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
