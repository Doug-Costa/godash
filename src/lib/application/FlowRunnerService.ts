import prisma from '@/lib/prisma';
import { Customer, FlowStep, FlowExecution } from '@prisma/client';
import { automationQueue } from '@/lib/queue/automationQueue';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';

export class FlowRunnerService {
  /**
   * Initializes a new flow execution for a customer
   */
  static async startFlow(customerId: string, flowId: string): Promise<FlowExecution> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      include: { steps: { orderBy: { order: 'asc' } } }
    });
    
    if (!flow || flow.steps.length === 0) {
      throw new Error(`Flow ${flowId} is invalid or empty`);
    }

    const firstStep = flow.steps[0];

    const execution = await prisma.flowExecution.create({
      data: {
        flowId,
        customerId,
        currentStepId: firstStep.id,
        status: 'RUNNING',
      }
    });

    // Schedule the first step processing immediately
    await this.scheduleStepExecution(execution.id, 0);

    return execution;
  }

  /**
   * Schedules a step to be processed by the BullMQ worker
   */
  static async scheduleStepExecution(executionId: string, delayMs: number = 0) {
    await automationQueue.add(
      'process-flow-step',
      { executionId },
      { delay: delayMs }
    );
  }

  /**
   * Process the current step of a flow execution.
   * This is meant to be called by a Worker queue for reliability.
   */
  static async processExecution(executionId: string) {
    const execution = await prisma.flowExecution.findUnique({
      where: { id: executionId },
      include: {
        customer: true,
        flow: { include: { steps: true } }
      }
    });

    if (!execution || execution.status !== 'RUNNING') return;
    
    // Check if customer has human takeover active
    if (execution.customer.humanTakeover) {
      console.log(`[FlowRunner] Execution ${executionId} paused due to Human Takeover.`);
      // We keep the status as RUNNING but we don't proceed. 
      // When humanTakeover is disabled, a 'resume' action should call scheduleStepExecution again.
      return;
    }

    if (!execution.currentStepId) {
      // Flow completed
      await this.markCompleted(executionId);
      return;
    }

    const currentStep = execution.flow.steps.find(s => s.id === execution.currentStepId);
    if (!currentStep) {
      await this.markFailed(executionId, 'Step not found');
      return;
    }

    let delayForNextStep = 0;

    switch (currentStep.type) {
      case 'MESSAGE':
        await this.executeMessage(execution.customer, currentStep);
        break;
      case 'DELAY':
        delayForNextStep = (currentStep.delayMinutes || 0) * 60 * 1000;
        break;
      case 'ACTION':
        await this.executeAction(execution.customer, currentStep);
        break;
      case 'CONDITION':
        // Not implemented in MVP, defaults to next step
        break;
    }

    // Move to next step
    if (currentStep.nextStepId) {
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: { currentStepId: currentStep.nextStepId }
      });
      await this.scheduleStepExecution(executionId, delayForNextStep);
    } else {
      await this.markCompleted(executionId);
    }
  }

  private static async executeMessage(customer: Customer, step: FlowStep) {
    if (!step.templateId) return;
    
    // Schedule a legacy Task to send the actual message.
    // In V2 we might bypass Tasks table and send directly, 
    // but using the Tasks table allows integration with the existing automation worker.
    await prisma.task.create({
      data: {
        customerId: customer.id,
        taskType: 'WHATSAPP', // Hardcoded for MVP, should be read from template type
        status: 'PENDING',
        scheduledFor: new Date(),
        completionNote: JSON.stringify({ templateId: step.templateId })
      }
    });
    
    console.log(`[FlowRunner] Scheduled MESSAGE for Customer ${customer.id}`);
  }

  private static async executeAction(customer: Customer, step: FlowStep) {
    // Action: Change Stage / Pipeline
    if (step.targetStage || step.targetPipelineId) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          stage: step.targetStage || customer.stage,
          pipelineId: step.targetPipelineId || customer.pipelineId
        }
      });
      console.log(`[FlowRunner] Changed stage to ${step.targetStage} for Customer ${customer.id}`);
    }
  }

  private static async markCompleted(executionId: string) {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { status: 'COMPLETED', currentStepId: null }
    });
    console.log(`[FlowRunner] Execution ${executionId} COMPLETED`);
  }

  private static async markFailed(executionId: string, error: string) {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { status: 'FAILED' }
    });
    console.log(`[FlowRunner] Execution ${executionId} FAILED: ${error}`);
  }
}
