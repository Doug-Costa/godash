import { NextResponse } from 'next/server';
import { automationQueue } from '@/lib/queue/automationQueue';

export async function GET() {
  const waiting = await automationQueue.getWaitingCount();
  const active = await automationQueue.getActiveCount();
  const completed = await automationQueue.getCompletedCount();
  return NextResponse.json({ waiting, active, completed });
}
