import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import LiderancaCard from '@/components/LiderancaCard';

const statusFilters = ['Todas', 'Ativa', 'Potencial', 'Em negociação', 'Fraca', 'Descartada'];

interface LiderancaRow {
  id: string;
  status: string;
  tipo_lideranca: string | null;
  nivel: string | null;
  zona_atuacao: string | null;
  apoiadores_estimados: number | null;
  cadastrado_por: string | null;
  pessoas: {
    nome: string;
    municipio_eleitoral: string | null;
  };
  usuarios: {
    nome: string;
  } | null;
}

export default function Liderancas() {
  const { usuario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<LiderancaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [agenteFilter, setAgenteFilter] = useState('');
  const [agentes, setAgentes] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetchData();
    if (isAdmin) fetchAgentes();
  }, [usuario, isAdmin]);

  const fetchAgentes = async () => {
    const { data } = await supabase.from('usuarios').select('id, nome').eq('tipo', 'agente');
    if (data) setAgentes(data);
  };

  const fetchData = async () => {
    if (!usuario) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('liderancas')
      .select('id, status, tipo_lideranca, nivel, zona_atuacao, apoiadores_estimados, cadastrado_por, pessoas(nome, municipio_eleitoral), usuarios(nome)')
      .order('criado_em', { ascending: false });
    if (!error && data) setData(data as unknown as LiderancaRow[]);
    setLoading(false);
  };

  const filtered = data.filter(l => {
    if (statusFilter !== 'Todas' && l.status !== statusFilter) return false;
    if (agenteFilter && l.cadastrado_por !== agenteFilter) return false;
    return true;
  });

  return (
    <AppLayout
      title={isAdmin ? 'Lideranças da campanha' : 'Minhas lideranças'}
      subtitle="Gerencie a rede política em campo"
    >
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {statusFilters.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              statusFilter === s
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <select
            value={agenteFilter}
            onChange={e => setAgenteFilter(e.target.value)}
            className="flex-1 h-10 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none"
          >
            <option value="">Todos os agentes</option>
            {agentes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      )}

      {/* Stats for admin */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: data.length },
            { label: 'Ativas', value: data.filter(l => l.status === 'Ativa').length },
            { label: 'Apoiadores', value: data.reduce((s, l) => s + (l.apoiadores_estimados || 0), 0) },
          ].map(s => (
            <div key={s.label} className="section-card text-center !p-3">
              <p className="text-lg font-bold text-primary">{s.value}</p>
              <p className="text-micro text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="section-card animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhuma liderança encontrada</p>
          <button onClick={() => navigate('/nova-lideranca')}
            className="mt-3 text-primary text-sm font-medium">
            Cadastrar primeira liderança
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <LiderancaCard
              key={l.id}
              nome={l.pessoas?.nome || '—'}
              status={l.status}
              tipo_lideranca={l.tipo_lideranca}
              nivel={l.nivel}
              zona_atuacao={l.zona_atuacao}
              municipio_eleitoral={l.pessoas?.municipio_eleitoral}
              apoiadores_estimados={l.apoiadores_estimados}
              cadastrado_por_nome={l.usuarios?.nome}
              showAgent={isAdmin}
              onClick={() => navigate(`/lideranca/${l.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/nova-lideranca')}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 gradient-primary rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center text-white hover:shadow-pink-500/50 transition-all active:scale-90"
        style={{ maxWidth: '672px' }}
      >
        <Plus size={26} />
      </button>
    </AppLayout>
  );
}
