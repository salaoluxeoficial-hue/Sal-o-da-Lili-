import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export function SupabaseRLSTest() {
  const [testResult, setTestResult] = useState<{
    status: 'pending' | 'success' | 'error';
    count: number | null;
    userId: string | null;
    error: string | null;
  }>({
    status: 'pending',
    count: null,
    userId: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    async function runTest() {
      try {
        // Ensure authenticated session (anonymous or existing session)
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          if (authError) {
            console.warn('[Supabase Test] Warning during anonymous sign in:', authError.message);
          } else {
            user = authData.user;
          }
        }

        const userId = user?.id || null;

        // Perform select count(*) query on chat_conversations table
        const { count, error } = await supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('[Supabase RLS Test] Failed query select count(*) on chat_conversations:', error);
          if (isMounted) {
            setTestResult({
              status: 'error',
              count: null,
              userId,
              error: error.message || JSON.stringify(error),
            });
          }
        } else {
          console.log('[Supabase RLS Test] Query select count(*) on chat_conversations successful!', {
            count,
            userId,
          });
          if (isMounted) {
            setTestResult({
              status: 'success',
              count: count ?? 0,
              userId,
              error: null,
            });
          }
        }
      } catch (err: any) {
        console.error('[Supabase RLS Test] Exception while performing count query:', err);
        if (isMounted) {
          setTestResult({
            status: 'error',
            count: null,
            userId: null,
            error: err?.message || 'Erro inesperado',
          });
        }
      }
    }

    runTest();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed bottom-3 right-3 z-50 text-xs bg-slate-900/90 text-slate-200 border border-slate-700 rounded-lg p-2.5 shadow-lg backdrop-blur max-w-sm pointer-events-auto">
      <div className="flex items-center gap-2 font-mono text-[11px] mb-1">
        <span className={`w-2 h-2 rounded-full ${testResult.status === 'success' ? 'bg-emerald-400 animate-pulse' : testResult.status === 'error' ? 'bg-rose-500' : 'bg-amber-400 animate-ping'}`} />
        <span className="font-semibold text-slate-100">Supabase RLS Diagnostic</span>
      </div>
      <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
        <div>Table: <span className="text-amber-300">chat_conversations</span></div>
        <div>Auth UID: <span className="text-cyan-300">{testResult.userId ? testResult.userId.slice(0, 12) + '...' : 'Sem UID'}</span></div>
        {testResult.status === 'pending' && <div className="text-amber-400">Consultando select count(*)...</div>}
        {testResult.status === 'success' && (
          <div className="text-emerald-400 font-semibold">
            Count: {testResult.count} (Conexão & RLS OK)
          </div>
        )}
        {testResult.status === 'error' && (
          <div className="text-rose-400 text-[10px] break-words">
            Erro: {testResult.error}
          </div>
        )}
      </div>
    </div>
  );
}
