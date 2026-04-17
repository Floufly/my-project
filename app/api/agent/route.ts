import { NextRequest, NextResponse } from 'next/server';
import { getAgentState, updateAgentState, getLogs, clearLogs } from '@/lib/agent-db';
import { requestStop } from '@/lib/agent-runner';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'state';

  if (action === 'logs') {
    return NextResponse.json(getLogs(200));
  }

  return NextResponse.json(getAgentState());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, config } = body as { action: string; config?: Record<string, unknown> };

  if (action === 'stop') {
    requestStop();
    updateAgentState({ status: 'paused', currentStep: null });
    return NextResponse.json({ success: true, message: 'Arrêt demandé' });
  }

  if (action === 'clear-logs') {
    clearLogs();
    return NextResponse.json({ success: true });
  }

  if (action === 'update-config' && config) {
    const state = getAgentState();
    updateAgentState({ config: { ...state.config, ...config } });
    return NextResponse.json({ success: true });
  }

  if (action === 'reset-stats') {
    updateAgentState({ totalScanned: 0, totalGenerated: 0, totalContacted: 0, totalConverted: 0 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
}
