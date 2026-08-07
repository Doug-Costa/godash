import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CustomerCreationService } from '@/lib/application/CustomerCreationService';
import { SaleChannel } from '@prisma/client';

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
      ...customFields 
    } = body;

    if (!formId) {
      return corsResponse({ success: false, error: 'formId é obrigatório' }, 400);
    }

    // 1. Fetch Form settings
    const formConfig = await prisma.form.findUnique({
      where: { id: formId },
      include: { product: true }
    });

    if (!formConfig) {
      return corsResponse({ success: false, error: 'Formulário não encontrado' }, 404);
    }

    // 2. Perform Customer creation / Identity Resolution
    const metadata = {
      fullName: name || 'Sem Nome',
      email: email || '',
      phoneNumber: phone || '',
      ...customFields
    };

    const customer = await CustomerCreationService.createOrMerge({
      pipelineId: formConfig.pipelineId,
      stage: formConfig.stageId || 'novo_cadastro',
      source: `Form Capture: ${formConfig.name}`,
      metadata,
      productId: formConfig.productId || undefined,
      pricePaid: formConfig.product?.price || formConfig.product?.basePrice || undefined,
      saleChannel: SaleChannel.INBOUND_FORM
    });

    if (!customer) {
      throw new Error('Falha ao processar ou unificar o lead.');
    }

    // 3. Update Opportunity UTM and campaign relations
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
          saleChannel: SaleChannel.INBOUND_FORM
        }
      });
      console.log(`[Capture API] Updated Opportunity ${activeOpp.id} with UTM tracking metadata`);
    }

    // 4. TODO: Disparar evento para Conversions API da Meta (CAPI) se fbc/fbp estiverem presentes
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
