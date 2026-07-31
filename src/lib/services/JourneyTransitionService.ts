import prisma from '../prisma';

export class JourneyTransitionService {
  static async handleTransition(
    customerId: string,
    externalPersonId: number,
    resolvedJourneyId: string | null,
    stage: 'ganho' | 'perdido',
    authorId?: string | null
  ) {
    if (!resolvedJourneyId) return;

    try {
      // 1. Fetch current journey and check for win/lose target
      const currentJourney = await prisma.journey.findUnique({
        where: { id: resolvedJourneyId }
      });

      if (!currentJourney) return;

      const targetJourneyId = stage === 'ganho'
        ? currentJourney.onWinJourneyId
        : currentJourney.onLoseJourneyId;

      if (targetJourneyId) {
        console.log(`[JourneyTransitionService] Promoting customer externalId ${externalPersonId} from journey ${resolvedJourneyId} to target journey ${targetJourneyId} (Stage: ${stage.toUpperCase()})`);

        const targetJourney = await prisma.journey.findUnique({
          where: { id: targetJourneyId }
        });

        if (targetJourney) {
          // Resolve target pipelineId
          let targetPipelineId = targetJourney.pipelineId;
          if (!targetPipelineId) {
            const pipelineName = stage === 'ganho' ? 'CS' : 'Nutrição';
            const defaultPipe = await prisma.pipeline.findFirst({
              where: { name: pipelineName }
            });
            targetPipelineId = defaultPipe?.id || null;
          }

          const currentCustomer = await prisma.customer.findUnique({
            where: { id: customerId }
          });

          if (currentCustomer) {
            // Prepare new Customer data
            const newCustomerData = {
              externalPersonId,
              journeyId: targetJourneyId,
              pipelineId: targetPipelineId || currentCustomer.pipelineId,
              stage: 'novo_cadastro',
              assigneeId: currentCustomer.assigneeId,
              joinedJourneyAt: new Date(),
              metadata: currentCustomer.metadata || {},
              isInNurturing: stage === 'perdido',
              nurturingJourneyId: stage === 'perdido' ? targetJourneyId : null,
            };

            // Upsert target customer
            let newCustomer = await prisma.customer.findFirst({
              where: { externalPersonId, journeyId: targetJourneyId }
            });

            if (newCustomer) {
              newCustomer = await prisma.customer.update({
                where: { id: newCustomer.id },
                data: newCustomerData
              });
            } else {
              newCustomer = await prisma.customer.create({
                data: newCustomerData
              });
            }

            // Schedule automations
            const automations = await prisma.automation.findMany({
              where: { journeyId: targetJourneyId, isActive: true }
            });

            try {
              const { automationQueue } = await import('../queue/automationQueue');
              for (const auto of automations) {
                const delayMs = auto.delayDays > 0
                  ? auto.delayDays * 24 * 60 * 60 * 1000
                  : (auto.delay || 0) * 60 * 1000;

                await automationQueue.add(
                  'execute-automation',
                  {
                    customerId: newCustomer.id,
                    automationId: auto.id,
                    journeyId: targetJourneyId
                  },
                  { delay: delayMs }
                );
              }
              console.log(`[JourneyTransitionService] Scheduled ${automations.length} automations on automation-queue.`);
            } catch (qErr) {
              console.error('[JourneyTransitionService] Failed to schedule automations queue:', qErr);
            }

            // Log interaction on target customer
            await prisma.interaction.create({
              data: {
                customerId: newCustomer.id,
                text: `Lead promovido automaticamente para a esteira "${targetJourney.name}" (Gatilho: ${stage.toUpperCase()})`,
                authorId: authorId || null,
                type: 'SYSTEM',
                deliveryStatus: 'SENT',
                channel: 'SYSTEM'
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('[JourneyTransitionService] Transition execution failed:', error);
    }
  }

  static async mergeCustomerToGeneric(
    campaignCustomerId: string,
    externalPersonId: number | null,
    nextStage: string,
    authorId?: string | null
  ) {
    if (externalPersonId === null) {
      return null;
    }
    // 1. Find or create the generic customer (journeyId: null)
    let genericCustomer = await prisma.customer.findFirst({
      where: { externalPersonId, journeyId: null }
    });

    const campaignCust = await prisma.customer.findUnique({
      where: { id: campaignCustomerId }
    });

    if (!genericCustomer) {
      genericCustomer = await prisma.customer.create({
        data: {
          externalPersonId,
          journeyId: null,
          stage: nextStage,
          assigneeId: campaignCust?.assigneeId || authorId || null,
          metadata: campaignCust?.metadata || {},
          tag: campaignCust?.tag || null
        }
      });
    } else {
      genericCustomer = await prisma.customer.update({
        where: { id: genericCustomer.id },
        data: {
          stage: nextStage,
          assigneeId: campaignCust?.assigneeId || genericCustomer.assigneeId || authorId || null,
          metadata: { ...((genericCustomer.metadata as any) || {}), ...((campaignCust?.metadata as any) || {}) },
          tag: campaignCust?.tag || genericCustomer.tag || null
        }
      });
    }

    // 2. Re-associate interactions and tasks from campaign customer to generic customer
    await prisma.interaction.updateMany({
      where: { customerId: campaignCustomerId },
      data: { customerId: genericCustomer.id }
    });

    await prisma.task.updateMany({
      where: { customerId: campaignCustomerId },
      data: { customerId: genericCustomer.id }
    });

    // 3. Delete the campaign customer record
    await prisma.customer.delete({
      where: { id: campaignCustomerId }
    });

    return genericCustomer;
  }
}
