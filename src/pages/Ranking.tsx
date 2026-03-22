import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';

interface AgenteStats {
  id: string;
  nome: string;
  total: number;
  ativas: number;
  apoiadores: number;
}

export default function Ranking() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AgenteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    // Get all agentes
    const { data: agentes } = await supabase.from('usuarios').select('id, nome').eq('tipo', 'agente');
    if (!agentes) { setLoading(false); return; }

    // Get all liderancas
    const { data: liderancas } = await supabase.from('liderancas').select('cadastrado_por, status, apoiadores_estimados');
    if (!liderancas) { setLoading(false); return; }

    const result: AgenteStats[] = agentes.map(a => {
      const mine = liderancas.filter(l => l.cadastrado_por === a.id);
      return {
        id: a.id,
        nome: a.nome,
        total: mine.length,
        ativas: mine.filter(l => l.status === 'Ativa').length,
        apoiadores: mine.reduce((s, l) => s + (l.apoiadores_estimados || 0), 0),
      };
    }).sort((a, b) => b.total - a.total);

    setStats(result);
    setLoading(false);
  };

  return (
    <AppLayout title="Ranking de Agentes" subtitle="Quem mais cadastrou lideranças">
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="section-card animate-pulse"><div className="h-4 bg-muted rounded w-2/3" /></div>)}</div>
      ) : stats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum agente cadastrado</p>
      ) : (
        <div className="space-y-3">
          {stats.map((a, i) => (
            <div key={a.id} className="section-card">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{a.nome}</p>
                  <div className="flex gap-4 text-micro text-muted-foreground mt-0.5">
                    <span>Cadastradas: <strong className="text-foreground">{a.total}</strong></span>
                    <span>Ativas: <strong className="text-emerald-500">{a.ativas}</strong></span>
                    <span>Apoiadores: <strong className="text-foreground">{a.apoiadores}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
