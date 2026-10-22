/**
 * undo-merge.ts — desfaz uma junção de fichas pelo terminal (alternativa à tela
 * "Histórico de junções"). Mesma lógica e mesma auditoria: src/lib/services/MergeUndoService.ts
 *
 * Uso:
 *   npx tsx prisma/undo-merge.ts <mergeEventId>                                  # PRÉVIA — não grava nada
 *   npx tsx prisma/undo-merge.ts <mergeEventId> --apply --reason "motivo"        # desfaz e registra
 *   docker exec -it dentalgo-bi npx tsx prisma/undo-merge.ts <mergeEventId> [...]
 */

import prisma from '../src/lib/prisma';
import { MergeUndoService } from '../src/lib/services/MergeUndoService';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const reasonIdx = args.indexOf('--reason');
  const reason = reasonIdx >= 0 ? args[reasonIdx + 1] ?? '' : '';
  // O id é o argumento solto que não é o valor de --reason
  const mergeEventId = args.find((a, i) => !a.startsWith('--') && !(reasonIdx >= 0 && i === reasonIdx + 1));

  if (!mergeEventId) throw new Error('Informe o id da junção (MergeEvent).');
  if (apply && (!reason || reason.trim().length < 5)) {
    throw new Error('Informe o motivo: --reason "motivo do desfazer" (mínimo 5 caracteres).');
  }

  const report = apply
    ? await MergeUndoService.undo(mergeEventId, null, `[terminal] ${reason.trim()}`)
    : await MergeUndoService.preview(mergeEventId);

  console.log(`\n═══ Desfazer junção ${mergeEventId} — ${apply ? 'DESFEITA' : 'PRÉVIA (nada foi gravado)'} ═══`);
  console.log(JSON.stringify(report, null, 2));
  if (!apply) console.log('\nPara desfazer: rode de novo com --apply --reason "motivo".');
}

main()
  .catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
