import { NextResponse } from 'next/server';
import { runAgentCycle, isRunning } from '@/lib/agent-runner';
import type { AgentEvent } from '@/lib/agent-runner';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST() {
  if (isRunning()) {
    return NextResponse.json({ error: 'Agent déjà en cours' }, { status: 409 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: AgentEvent) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // stream closed
        }
      }

      try {
        await runAgentCycle(emit);
      } catch (err) {
        emit({ type: 'error', data: { message: err instanceof Error ? err.message : String(err) } });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
