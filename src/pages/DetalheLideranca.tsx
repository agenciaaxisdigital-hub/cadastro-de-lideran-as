import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Mail, Edit, Trash2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { maskCPF } from '@/lib/cpf';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';

export default function DetalheLideranca() {
  const { id } = useParams();
  const { usuario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('liderancas')
      .select('*, pessoas(*), usuarios(nome)')
      .eq('id', id!)
      .maybeSingle();
    if (!error) setData(data);
    setLoading(false);
  };

  const handleDiscard = async () => {
    await supabase.from('liderancas').update({ status: 'Descartada', atualizado_em: new Date().toISOString() }).eq('id', id!);
    toast({ title: 'Liderança descartada' });
    navigate('/');
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta liderança permanentemente?')) return;
    setDeleting(true);
    await supabase.from('liderancas').delete().eq('id', id!);
    toast({ title: 'Liderança excluída' });
    navigate('/');
  };

  if (loading) return <AppLayout title="Carregando..."><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="section-card"><div className="h-4 bg-muted rounded w-2/3" /></div>)}</div></AppLayout>;
  if (!data) return <AppLayout title="Não encontrada"><p className="text-muted-foreground">Liderança não encontrada.</p></AppLayout>;

  const p = data.pessoas;
  const canEdit = isAdmin || data.cadastrado_por === usuario?.id;

  const InfoRow = ({ label, value, link }: { label: string; value?: string | null; link?: string }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0">
        <span className="text-micro text-muted-foreground shrink-0">{label}</span>
        {link ? (
          <a href={link} target="_blank" rel="noopener" className="text-sm text-primary text-right ml-2">{value}</a>
        ) : (
          <span className="text-sm text-foreground text-right ml-2">{value}</span>
        )}
      </div>
    );
  };

  return (
    <AppLayout title={p.nome} showNav={false}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div className="section-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{p.nome}</h2>
            <p className="text-sm text-muted-foreground">{data.tipo_lideranca}{data.nivel ? ` · ${data.nivel}` : ''}</p>
            {isAdmin && data.usuarios && (
              <p className="text-micro text-primary/70 mt-1">
                Cadastrada por: {data.usuarios.nome} · {new Date(data.criado_em).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <StatusBadge status={data.status} />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2">
          {p.telefone && (
            <a href={`tel:${p.telefone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-foreground">
              <Phone size={14} /> Ligar
            </a>
          )}
          {p.whatsapp && (
            <a href={`https://wa.me/55${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-foreground">
              <Mail size={14} /> E-mail
            </a>
          )}
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="section-card">
        <h3 className="section-title">Dados Pessoais</h3>
        <InfoRow label="CPF" value={p.cpf ? maskCPF(p.cpf) : null} />
        <InfoRow label="Telefone" value={p.telefone} link={p.telefone ? `tel:${p.telefone}` : undefined} />
        <InfoRow label="WhatsApp" value={p.whatsapp} />
        <InfoRow label="E-mail" value={p.email} link={p.email ? `mailto:${p.email}` : undefined} />
        <InfoRow label="Instagram" value={p.instagram} link={p.instagram ? `https://instagram.com/${p.instagram.replace('@', '')}` : undefined} />
        <InfoRow label="Facebook" value={p.facebook} />
      </div>

      {/* Dados Eleitorais */}
      <div className="section-card">
        <h3 className="section-title">Dados Eleitorais</h3>
        <InfoRow label="Título" value={p.titulo_eleitor} />
        <InfoRow label="Zona / Seção" value={p.zona_eleitoral || p.secao_eleitoral ? `${p.zona_eleitoral || '—'} / ${p.secao_eleitoral || '—'}` : null} />
        <InfoRow label="Município / UF" value={p.municipio_eleitoral || p.uf_eleitoral ? `${p.municipio_eleitoral || '—'} / ${p.uf_eleitoral || '—'}` : null} />
        <InfoRow label="Colégio" value={p.colegio_eleitoral} />
        <InfoRow label="End. colégio" value={p.endereco_colegio} />
        <InfoRow label="Situação" value={p.situacao_titulo} />
      </div>

      {/* Perfil */}
      <div className="section-card">
        <h3 className="section-title">Perfil da Liderança</h3>
        <InfoRow label="Tipo" value={data.tipo_lideranca} />
        <InfoRow label="Nível" value={data.nivel} />
        <InfoRow label="Região" value={data.regiao_atuacao} />
        <InfoRow label="Zona atuação" value={data.zona_atuacao} />
        <InfoRow label="Bairros" value={data.bairros_influencia} />
        <InfoRow label="Comunidades" value={data.comunidades_influencia} />
        <InfoRow label="Origem" value={data.origem_captacao} />
      </div>

      {/* Força */}
      <div className="section-card">
        <h3 className="section-title">Força Política</h3>
        <InfoRow label="Apoiadores" value={data.apoiadores_estimados?.toString()} />
        <InfoRow label="Meta votos" value={data.meta_votos?.toString()} />
        <InfoRow label="Comprometimento" value={data.nivel_comprometimento} />
        {data.observacoes && (
          <div className="pt-2">
            <p className="label-micro mb-1">Observações</p>
            <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{data.observacoes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 pb-4">
        {canEdit && (
          <button onClick={() => navigate(`/editar-lideranca/${id}`)}
            className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
            <Edit size={18} /> Editar
          </button>
        )}
        {isAdmin && data.status !== 'Descartada' && (
          <button onClick={handleDiscard}
            className="w-full h-11 border border-border rounded-xl text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
            <XCircle size={16} /> Descartar liderança
          </button>
        )}
        {isAdmin && (
          <button onClick={handleDelete} disabled={deleting}
            className="w-full h-11 border border-destructive/30 rounded-xl text-destructive font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50">
            <Trash2 size={16} /> Excluir permanentemente
          </button>
        )}
      </div>
    </AppLayout>
  );
}
