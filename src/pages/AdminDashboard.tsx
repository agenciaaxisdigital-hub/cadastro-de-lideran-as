import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, TrendingUp, Award, Activity, ChevronDown, ChevronUp, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Lideranca {
  id: string;
  tipo_lideranca: string | null;
  nivel: string | null;
  status: string;
  regiao_atuacao: string | null;
  nivel_comprometimento: string | null;
  apoiadores_estimados: number | null;
  meta_votos: number | null;
  criado_em: string;
  cadastrado_por: string | null;
  pessoas: {
    nome: string;
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
    cpf: string | null;
  } | null;
}

interface Agente {
  id: string;
  nome: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Ativa': 'hsl(142 71% 45%)',
  'Potencial': 'hsl(217 91% 60%)',
  'Em negociação': 'hsl(45 93% 47%)',
  'Fraca': 'hsl(25 95% 53%)',
  'Descartada': 'hsl(0 72% 51%)',
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgente, setExpandedAgente] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    const [lRes, aRes] = await Promise.all([
      supabase.from('liderancas').select('*, pessoas(nome, telefone, whatsapp, email, cpf)'),
      supabase.from('usuarios').select('id, nome').eq('tipo', 'agente'),
    ]);
    if (lRes.data) setLiderancas(lRes.data as unknown as Lideranca[]);
    if (aRes.data) setAgentes(aRes.data);
    setLoading(false);
  };

  // ── Métricas gerais ──
  const totalLiderancas = liderancas.length;
  const totalApoiadores = liderancas.reduce((s, l) => s + (l.apoiadores_estimados || 0), 0);
  const totalMetaVotos = liderancas.reduce((s, l) => s + (l.meta_votos || 0), 0);
  const ativas = liderancas.filter(l => l.status === 'Ativa').length;

  // ── Por status (pie chart) ──
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    liderancas.forEach(l => { map[l.status] = (map[l.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [liderancas]);

  // ── Timeline (line chart) ──
  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    liderancas.forEach(l => {
      const d = new Date(l.criado_em);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        return ma !== mb ? ma - mb : da - db;
      })
      .map(([dia, total]) => ({ dia, total }));
  }, [liderancas]);

  // ── Ranking de agentes (bar chart) ──
  const rankingData = useMemo(() => {
    const map: Record<string, number> = {};
    liderancas.forEach(l => {
      if (l.cadastrado_por) map[l.cadastrado_por] = (map[l.cadastrado_por] || 0) + 1;
    });
    return agentes
      .map(a => ({ nome: a.nome.split(' ')[0], total: map[a.id] || 0, id: a.id }))
      .sort((a, b) => b.total - a.total);
  }, [liderancas, agentes]);

  // ── Agente details ──
  const liderancasPorAgente = useMemo(() => {
    const map: Record<string, Lideranca[]> = {};
    liderancas.forEach(l => {
      const key = l.cadastrado_por || 'sem_agente';
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [liderancas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[1.5px] gradient-header" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-xl hover:bg-muted active:scale-95 transition-all">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard Admin</h1>
            <p className="text-[10px] text-muted-foreground">Controle geral da rede</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* ── Resumo Geral ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: 'Lideranças', value: totalLiderancas, sub: `${ativas} ativas` },
            { icon: Activity, label: 'Agentes', value: agentes.length, sub: 'cadastrados' },
            { icon: TrendingUp, label: 'Apoiadores', value: totalApoiadores.toLocaleString('pt-BR'), sub: 'estimados' },
            { icon: Award, label: 'Meta votos', value: totalMetaVotos.toLocaleString('pt-BR'), sub: 'total acumulado' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="section-card flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Status (pie) ── */}
        <div className="section-card">
          <h2 className="section-title">📊 Distribuição por Status</h2>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30} strokeWidth={2} stroke="hsl(var(--background))">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.name] || 'hsl(var(--muted-foreground))' }} />
                  <span className="text-foreground font-medium">{s.name}</span>
                  <span className="text-muted-foreground ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="section-card">
          <h2 className="section-title">📈 Cadastros por Dia</h2>
          {timelineData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum cadastro encontrado</p>
          )}
        </div>

        {/* ── Ranking de Agentes ── */}
        <div className="section-card">
          <h2 className="section-title">🏆 Ranking de Agentes</h2>
          {rankingData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum agente encontrado</p>
          )}
        </div>

        {/* ── Detalhes por Agente ── */}
        <div className="section-card">
          <h2 className="section-title">👥 Detalhes por Agente</h2>
          <div className="space-y-2">
            {agentes.map(agente => {
              const items = liderancasPorAgente[agente.id] || [];
              const isOpen = expandedAgente === agente.id;
              const ultimoCadastro = items.length > 0
                ? new Date(Math.max(...items.map(i => new Date(i.criado_em).getTime())))
                : null;

              return (
                <div key={agente.id} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedAgente(isOpen ? null : agente.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{agente.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{agente.nome}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {items.length} cadastro{items.length !== 1 ? 's' : ''}
                          {ultimoCadastro && ` · Último: ${ultimoCadastro.toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{items.length}</span>
                      {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
                      {/* Stats do agente */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Ativas', value: items.filter(i => i.status === 'Ativa').length },
                          { label: 'Apoiadores', value: items.reduce((s, i) => s + (i.apoiadores_estimados || 0), 0) },
                          { label: 'Meta votos', value: items.reduce((s, i) => s + (i.meta_votos || 0), 0) },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-card rounded-lg p-2 text-center border border-border">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-base font-bold text-foreground">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Lista de lideranças */}
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum cadastro ainda</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="bg-card rounded-xl p-3 border border-border space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">{item.pessoas?.nome || '—'}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  item.status === 'Ativa' ? 'bg-emerald-500/10 text-emerald-600' :
                                  item.status === 'Potencial' ? 'bg-blue-500/10 text-blue-600' :
                                  item.status === 'Em negociação' ? 'bg-amber-500/10 text-amber-600' :
                                  item.status === 'Fraca' ? 'bg-orange-500/10 text-orange-600' :
                                  'bg-red-500/10 text-red-600'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                {item.tipo_lideranca && (
                                  <span className="flex items-center gap-1"><MapPin size={10} /> {item.tipo_lideranca}</span>
                                )}
                                {item.nivel && (
                                  <span>{item.nivel}</span>
                                )}
                                {item.pessoas?.telefone && (
                                  <span className="flex items-center gap-1"><Phone size={10} /> {item.pessoas.telefone}</span>
                                )}
                                {item.pessoas?.email && (
                                  <span className="flex items-center gap-1"><Mail size={10} /> {item.pessoas.email}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar size={10} />
                                {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                                {item.regiao_atuacao && ` · ${item.regiao_atuacao}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
