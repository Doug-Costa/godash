import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CustomerCreationService } from '@/lib/application/CustomerCreationService';
import { SaleChannel } from '@prisma/client';
import { LeadAttributionService } from '@/lib/services/LeadAttributionService';
import { RoutingEngineService } from '@/lib/services/RoutingEngineService';
import { AssignCampaignLeadsUseCase } from '@/lib/application/AssignCampaignLeadsUseCase';

// Helper function to return headers supporting CORS
function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Handle preflight OPTIONS requests for CORS validation
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      formId, 
      name, 
      email, 
      phone, 
      utm_source, 
      utm_medium, 
      utm_campaign, 
      utm_term, 
      utm_content, 
      fbc, 
      fbp, 
      page_url,
      referrer,
      ...customFields 
    } = body;

    if (!formId) {
      return corsResponse({ success: false, error: 'formId é obrigatório' }, 400);
    }

    // 1. Fetch Form settings
    const formConfig = await prisma.form.findUnique({
      where: { id: formId },
      include: { product: true, pipeline: true, journey: true }
    });

    if (!formConfig) {
      return corsResponse({ success: false, error: 'Formulário não encontrado' }, 404);
    }

    // 2. Perform Customer creation / Identity Resolution
    const attribution = LeadAttributionService.classify({
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      pageUrl: page_url,
      referrer
    });

    const metadata = {
      fullName: name || 'Sem Nome',
      email: email || '',
      phoneNumber: phone || '',
      lastFormId: formConfig.id,
      lastFormName: formConfig.name,
      attributionChannel: attribution.channel,
      attributionPlatform: attribution.platform,
      ...customFields
    };

    const customer = await CustomerCreationService.createOrMerge({
      pipelineId: formConfig.pipelineId,
      stage: formConfig.stageId || 'novo_cadastro',
      source: `Form Capture: ${formConfig.name}`,
      metadata,
      productId: formConfig.productId || undefined,
      pricePaid: formConfig.product?.price || formConfig.product?.basePrice || undefined,
      saleChannel: SaleChannel.INBOUND_FORM,
      isPurchase: false
    });

    if (!customer) {
      throw new Error('Falha ao processar ou unificar o lead.');
    }

    // 3. Distribuição e jornada opcional. Formulário sempre cria DESEJO.
    let assignedToId: string | null = null;
    if (formConfig.journeyId) {
      const activeAgents = formConfig.assignmentMode === 'ROUND_ROBIN'
        ? await prisma.user.findMany({ where: { isActive: true, role: 'AGENT' }, select: { id: true } })
        : [];
      const assignment = await new AssignCampaignLeadsUseCase().execute(
        [customer.id],
        formConfig.journeyId,
        activeAgents.map(agent => agent.id),
        undefined,
        { mode: formConfig.assignmentMode as 'POOL' | 'ROUND_ROBIN' | 'FIXED', fixedAssigneeId: formConfig.fixedAssigneeId }
      );
      assignedToId = assignment[0]?.assigneeId || null;
    } else if (formConfig.assignmentMode === 'FIXED') {
      assignedToId = formConfig.fixedAssigneeId || null;
    } else if (formConfig.assignmentMode === 'ROUND_ROBIN') {
      assignedToId = await new RoutingEngineService().determineAssignee(
        customer.id,
        {
          routingMode: 'ROUND_ROBIN',
          useAccountManager: formConfig.pipeline.useAccountManager,
          strictSkillMatch: formConfig.pipeline.strictSkillMatch,
          productId: formConfig.productId
        },
        'AGENT'
      );
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(assignedToId ? { assigneeId: assignedToId } : {}),
        leadSource: `FORM:${formConfig.id}`,
        acquisitionChannel: attribution.channel
      }
    });

    // 4. Atualiza a oportunidade do funil do formulário com atribuição e marketing.
    const activeOpp = await prisma.opportunity.findFirst({
      where: { customerId: customer.id, pipelineId: formConfig.pipelineId },
    });

    if (activeOpp) {
      await prisma.opportunity.update({
        where: { id: activeOpp.id },
        data: {
          utmSource: utm_source || undefined,
          utmMedium: utm_medium || undefined,
          utmCampaign: utm_campaign || undefined,
          utmTerm: utm_term || undefined,
          utmContent: utm_content || undefined,
          sourceCampaignId: formConfig.campaignId || undefined,
          productId: formConfig.productId || undefined,
          pricePaid: formConfig.product?.price || formConfig.product?.basePrice || undefined,
          value: formConfig.product?.price || formConfig.product?.basePrice || undefined,
          saleChannel: SaleChannel.INBOUND_FORM,
          assigneeId: assignedToId,
          metadata: {
            formId: formConfig.id,
            formName: formConfig.name,
            pageUrl: page_url || null,
            referrer: referrer || null,
            attributionChannel: attribution.channel,
            attributionPlatform: attribution.platform,
            fbc: fbc || null,
            fbp: fbp || null
          }
        }
      });
      if (assignedToId) {
        const openAssignment = await prisma.leadAssignmentHistory.findFirst({
          where: { opportunityId: activeOpp.id, assigneeId: assignedToId, releasedAt: null }
        });
        if (!openAssignment) {
          await prisma.leadAssignmentHistory.create({
            data: { opportunityId: activeOpp.id, assigneeId: assignedToId, reason: 'FORM_CAPTURE' }
          });
        }
      }
      console.log(`[Capture API] Updated Opportunity ${activeOpp.id} with UTM tracking metadata`);
    }

    // 5. TODO: Disparar evento para Conversions API da Meta (CAPI) se fbc/fbp estiverem presentes
    if (fbc || fbp) {
      await triggerMetaConversionsAPI({
        email,
        phone,
        fbc,
        fbp,
        eventName: 'Lead',
        url: request.url,
      });
    }

    return corsResponse({ 
      success: true, 
      redirectUrl: formConfig.redirectUrl || null,
      message: formConfig.successMessage || 'Formulário enviado com sucesso!'
    });

  } catch (error: any) {
    console.error('[Capture API Error]:', error);
    return corsResponse({ success: false, error: error.message }, 500);
  }
}

// Meta Conversions API Trigger (Placeholder framework for future activation)
async function triggerMetaConversionsAPI(data: { email?: string; phone?: string; fbc?: string; fbp?: string; eventName: string; url: string }) {
  // TODO: Integrar com Meta CAPI POST endpoint
  console.log('[Meta CAPI SDK/POST Request Mock]: sending lead event', data);
}
