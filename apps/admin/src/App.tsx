import { useEffect, useState } from 'react';
import type { Health } from '@mims/contracts';
import { api } from '@/lib/api-client';

type State =
  { status: 'loading' } | { status: 'ok'; health: Health } | { status: 'error'; message: string };

/**
 * Placeholder admin shell. Routing, the parts catalogue and the price editor come
 * later; today this proves the SPA reaches the API with the shared contract types.
 */
export function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    api
      .health(controller.signal)
      .then((health) => setState({ status: 'ok', health }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Failed' });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 font-mono text-sm">
      <h1 className="text-lg font-semibold">MIMS Admin</h1>
      <p className="mt-1 text-neutral-600">Scaffold only. No features are implemented yet.</p>

      <section className="mt-6 rounded border border-neutral-300 p-4 text-xs">
        <h2 className="mb-2 font-semibold">API connection</h2>
        {state.status === 'loading' && <p>Checking…</p>}
        {state.status === 'error' && <p className="text-red-700">Unreachable — {state.message}</p>}
        {state.status === 'ok' && (
          <pre className="whitespace-pre-wrap">{JSON.stringify(state.health, null, 2)}</pre>
        )}
      </section>
    </main>
  );
}
