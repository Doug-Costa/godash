import { NextResponse } from 'next/server';
import { LeadSlaService } from '@/lib/application/LeadSlaService';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const slaService = new LeadSlaService();
    // Recycle leads inactive for 5 days
    const recycledCount = await slaService.recycleIdleLeads(5);

    return NextResponse.json({
      success: true,
      message: 'SLA check completed successfully.',
      recycledCount,
    });
  } catch (error: any) {
    console.error('SLA Route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
