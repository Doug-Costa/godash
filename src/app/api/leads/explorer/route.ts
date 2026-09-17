import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { LeadExplorerQueryService } from '@/lib/services/LeadExplorerQueryService';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const planId = searchParams.get('planId') || 'all';
    const subscriptionStatus = searchParams.get('subscriptionStatus') || 'all';
    const productId = searchParams.get('productId') || 'all';
    const relationshipType = searchParams.get('relationshipType') || 'all';
    const journeyId = searchParams.get('journeyId') || 'all';
    const assigneeId = searchParams.get('assigneeId') || 'all';
    const stage = searchParams.get('stage') || 'all';
    const batchId = searchParams.get('batchId') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const exportAll = searchParams.get('exportAll') === 'true';
    
    // Pagination params: default 20, max 200
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const allMergedLeads = await LeadExplorerQueryService.fetchMatchingLeads({
      source,
      planId,
      subscriptionStatus,
      productId,
      relationshipType,
      journeyId,
      assigneeId,
      stage,
      batchId,
      startDate,
      endDate,
      search
    });

    const total = allMergedLeads.length;

    if (exportAll) {
      return NextResponse.json({
        success: true,
        total,
        page: 1,
        limit: total,
        totalPages: 1,
        leads: allMergedLeads
      });
    }

    const offset = (page - 1) * limit;
    const paginatedLeads = allMergedLeads.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      leads: paginatedLeads
    });
  } catch (error: any) {
    console.error('[Explorer API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
