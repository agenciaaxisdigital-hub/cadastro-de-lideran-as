import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, cleanCPF, validateCPF } from '@/lib/cpf';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';

interface PessoaExistente {
  id: string;
  nome: string;
  cpf: string | null;
  municipio_eleitoral: string | null;
}

const tiposLideranca = ['Comunitária', 'Religiosa', 'Sindical', 'Estudantil', 'Empresarial', 'Influenciador digital', 'Liderança de bairro', 'Coordenador regional', 'Outro'];
const niveis = ['Municipal', 'Zonal', 'Bairro', 'Rua', 'Comunitário', 'Outro'];
const origens = ['Indicação de outra liderança', 'Abordagem do agente', 'Evento da campanha', 'Redes sociais', 'Espontâneo', 'Outro'];
const statusOptions = ['Ativa', 'Potencial', 'Em negociação', 'Fraca', 'Descartada'];
const comprometimentos = ['Alto', 'Médio', 'Baixo'];
const situacoesTitulo = ['Regular', 'Cancelado', 'Suspenso', 'Outro / Não informado'];

export default function NovaLideranca() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cpf' | 'form'>('cpf');
  const [cpfInput, setCpfInput] = useState('');
  const [pessoaExistente, setPessoaExistente] = useState<PessoaExistente | null>(null);
  const [usarPessoaExistente, setUsarPessoaExistente] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liderancasExistentes, setLiderancasExistentes] = useState<{ id: string; nome: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    cpf: '', nome: '', telefone: '', whatsapp: '', email: '',
    instagram: '', facebook: '',
    titulo_eleitor: '', zona_eleitoral: '', secao_eleitoral: '',
    municipio_eleitoral: '', uf_eleitoral: '', colegio_eleitoral: '',
    endereco_colegio: '', situacao_titulo: '',
    tipo_lideranca: '', nivel: '', regiao_atuacao: '',
    zona_atuacao: '', bairros_influencia: '', comunidades_influencia: '',
    lider_principal_id: '', origem_captacao: '',
    apoiadores_estimados: '', meta_votos: '',
    status: 'Ativa', nivel_comprometimento: '', observacoes: '',
  });

  useEffect(() => {
    fetchLiderancas();
  }, []);

  const fetchLiderancas = async () => {
    const { data } = await supabase
      .from('liderancas')
      .select('id, pessoas(nome)')
      .eq('status', 'Ativa');
    if (data) {
      setLiderancasExistentes(data.map((l: any) => ({ id: l.id, nome: l.pessoas?.nome || '—' })));
    }
  };

  const buscarCPF = async () => {
    const cleaned = cleanCPF(cpfInput);
    if (cleaned.length === 11 && !validateCPF(cleaned)) {
      toast({ title: 'CPF inválido', description: 'Verifique os números', variant: 'destructive' });
      return;
    }
    if (cleaned.length < 11) {
      toast({ title: 'CPF incompleto', variant: 'destructive' });
      return;
    }
    const { data } = await supabase.from('pessoas').select('id, nome, cpf, municipio_eleitoral').eq('cpf', cleaned).single();
    if (data) {
      setPessoaExistente(data as PessoaExistente);
    } else {
      setForm(f => ({ ...f, cpf: cleaned }));
      setStep('form');
    }
  };

  const usarPessoa = () => {
    if (pessoaExistente) {
      setUsarPessoaExistente(true);
      setForm(f => ({ ...f, cpf: pessoaExistente.cpf || '', nome: pessoaExistente.nome }));
      setStep('form');
    }
  };

  const skipCPF = () => {
    setStep('form');
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
    if (!form.telefone.trim() && !form.whatsapp.trim()) { toast({ title: 'Informe ao menos um telefone ou WhatsApp', variant: 'destructive' }); return; }
    if (!form.tipo_lideranca) { toast({ title: 'Selecione o tipo de liderança', variant: 'destructive' }); return; }
    if (!form.status) { toast({ title: 'Selecione o status', variant: 'destructive' }); return; }
    if (form.cpf && form.cpf.length === 11 && !validateCPF(form.cpf)) { toast({ title: 'CPF inválido', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      let pessoaId: string;

      if (usarPessoaExistente && pessoaExistente) {
        pessoaId = pessoaExistente.id;
        // Update pessoa data
        await supabase.from('pessoas').update({
          telefone: form.telefone || undefined,
          whatsapp: form.whatsapp || undefined,
          email: form.email || undefined,
          instagram: form.instagram || undefined,
          facebook: form.facebook || undefined,
          titulo_eleitor: form.titulo_eleitor || undefined,
          zona_eleitoral: form.zona_eleitoral || undefined,
          secao_eleitoral: form.secao_eleitoral || undefined,
          municipio_eleitoral: form.municipio_eleitoral || undefined,
          uf_eleitoral: form.uf_eleitoral || undefined,
          colegio_eleitoral: form.colegio_eleitoral || undefined,
          endereco_colegio: form.endereco_colegio || undefined,
          situacao_titulo: form.situacao_titulo || undefined,
          atualizado_em: new Date().toISOString(),
        }).eq('id', pessoaId);
        toast({ title: 'Pessoa já cadastrada, reaproveitando dados' });
      } else {
        const { data: novaPessoa, error } = await supabase.from('pessoas').insert({
          cpf: form.cpf || null,
          nome: form.nome,
          telefone: form.telefone || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          instagram: form.instagram || null,
          facebook: form.facebook || null,
          titulo_eleitor: form.titulo_eleitor || null,
          zona_eleitoral: form.zona_eleitoral || null,
          secao_eleitoral: form.secao_eleitoral || null,
          municipio_eleitoral: form.municipio_eleitoral || null,
          uf_eleitoral: form.uf_eleitoral || null,
          colegio_eleitoral: form.colegio_eleitoral || null,
          endereco_colegio: form.endereco_colegio || null,
          situacao_titulo: form.situacao_titulo || null,
        }).select('id').single();
        if (error) throw error;
        pessoaId = novaPessoa!.id;
      }

      const { error: lError } = await supabase.from('liderancas').insert({
        pessoa_id: pessoaId,
        tipo_lideranca: form.tipo_lideranca || null,
        nivel: form.nivel || null,
        regiao_atuacao: form.regiao_atuacao || null,
        zona_atuacao: form.zona_atuacao || null,
        bairros_influencia: form.bairros_influencia || null,
        comunidades_influencia: form.comunidades_influencia || null,
        lider_principal_id: form.lider_principal_id || null,
        origem_captacao: form.origem_captacao || null,
        apoiadores_estimados: form.apoiadores_estimados ? parseInt(form.apoiadores_estimados) : null,
        meta_votos: form.meta_votos ? parseInt(form.meta_votos) : null,
        status: form.status,
        nivel_comprometimento: form.nivel_comprometimento || null,
        observacoes: form.observacoes || null,
        cadastrado_por: usuario?.id || null,
      });
      if (lError) throw lError;

      toast({ title: 'Liderança cadastrada com sucesso' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'cpf') {
    return (
      <AppLayout title="Nova liderança" showNav={false}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="section-card">
          <h2 className="section-title">CPF do líder</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={formatCPF(cpfInput)}
              onChange={e => setCpfInput(cleanCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="flex-1 h-12 px-4 bg-card border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={14}
            />
            <button onClick={buscarCPF}
              className="h-12 px-4 gradient-primary text-white rounded-xl font-medium active:scale-95 transition-transform">
              <SearchIcon size={18} />
            </button>
          </div>
          <button onClick={skipCPF} className="text-sm text-primary font-medium">
            Continuar sem CPF →
          </button>
        </div>

        {pessoaExistente && (
          <div className="section-card border-amber-500/30">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">⚠️ Pessoa já cadastrada</p>
            <p className="text-sm"><strong>Nome:</strong> {pessoaExistente.nome}</p>
            {pessoaExistente.municipio_eleitoral && <p className="text-sm"><strong>Município:</strong> {pessoaExistente.municipio_eleitoral}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={usarPessoa}
                className="flex-1 h-10 gradient-primary text-white rounded-xl text-sm font-medium active:scale-95">
                Usar esta pessoa
              </button>
              <button onClick={() => { setPessoaExistente(null); setForm(f => ({ ...f, cpf: cleanCPF(cpfInput) })); setStep('form'); }}
                className="flex-1 h-10 border border-border rounded-xl text-sm font-medium text-muted-foreground active:scale-95">
                Criar nova
              </button>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  const InputField = ({ label, field, placeholder, type = 'text', required = false }: { label: string; field: string; placeholder?: string; type?: string; required?: boolean }) => (
    <div className="space-y-1">
      <label className="label-micro">{label}{required && <span className="text-primary ml-0.5">*</span>}</label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );

  const SelectField = ({ label, field, options, required = false }: { label: string; field: string; options: string[]; required?: boolean }) => (
    <div className="space-y-1">
      <label className="label-micro">{label}{required && <span className="text-primary ml-0.5">*</span>}</label>
      <select
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        className="w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <AppLayout title="Nova liderança" showNav={false}>
      <button onClick={() => setStep('cpf')} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Seção 1 — Dados Pessoais */}
      <div className="section-card">
        <h2 className="section-title">Dados Pessoais</h2>
        <InputField label="CPF" field="cpf" placeholder="Apenas números" />
        <InputField label="Nome completo" field="nome" required />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Telefone" field="telefone" placeholder="(00) 0000-0000" />
          <InputField label="WhatsApp" field="whatsapp" placeholder="(00) 00000-0000" />
        </div>
        <InputField label="E-mail" field="email" type="email" />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Instagram" field="instagram" placeholder="@usuario" />
          <InputField label="Facebook" field="facebook" />
        </div>
      </div>

      {/* Seção 2 — Dados Eleitorais */}
      <div className="section-card">
        <h2 className="section-title">Dados Eleitorais</h2>
        <p className="text-micro text-muted-foreground -mt-1">Dados importantes para a campanha</p>
        <InputField label="Título de eleitor" field="titulo_eleitor" />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Zona eleitoral" field="zona_eleitoral" />
          <InputField label="Seção eleitoral" field="secao_eleitoral" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <InputField label="Município eleitoral" field="municipio_eleitoral" />
          </div>
          <InputField label="UF" field="uf_eleitoral" placeholder="SP" />
        </div>
        <InputField label="Colégio eleitoral" field="colegio_eleitoral" placeholder="Nome da escola / local" />
        <div className="space-y-1">
          <label className="label-micro">Endereço do colégio</label>
          <textarea
            value={form.endereco_colegio}
            onChange={e => update('endereco_colegio', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <SelectField label="Situação do título" field="situacao_titulo" options={situacoesTitulo} />
      </div>

      {/* Seção 3 — Perfil da Liderança */}
      <div className="section-card">
        <h2 className="section-title">Perfil da Liderança</h2>
        <SelectField label="Tipo de liderança" field="tipo_lideranca" options={tiposLideranca} required />
        <SelectField label="Nível" field="nivel" options={niveis} />
        <div className="space-y-1">
          <label className="label-micro">Região de atuação</label>
          <textarea
            value={form.regiao_atuacao}
            onChange={e => update('regiao_atuacao', e.target.value)}
            rows={2}
            placeholder="Bairro X, Comunidade Y, entorno do Colégio Z"
            className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <InputField label="Zona de atuação" field="zona_atuacao" />
        <div className="space-y-1">
          <label className="label-micro">Bairros de influência</label>
          <textarea value={form.bairros_influencia} onChange={e => update('bairros_influencia', e.target.value)}
            rows={2} className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
        <div className="space-y-1">
          <label className="label-micro">Comunidades de influência</label>
          <textarea value={form.comunidades_influencia} onChange={e => update('comunidades_influencia', e.target.value)}
            rows={2} className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
        <div className="space-y-1">
          <label className="label-micro">Liderança principal</label>
          <select value={form.lider_principal_id} onChange={e => update('lider_principal_id', e.target.value)}
            className="w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Nenhuma (topo da hierarquia)</option>
            {liderancasExistentes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <SelectField label="Origem da captação" field="origem_captacao" options={origens} />
      </div>

      {/* Seção 4 — Força Política */}
      <div className="section-card">
        <h2 className="section-title">Força Política e Status</h2>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Apoiadores estimados" field="apoiadores_estimados" type="number" />
          <InputField label="Meta de votos" field="meta_votos" type="number" />
        </div>
        <SelectField label="Status" field="status" options={statusOptions} required />
        <SelectField label="Nível de comprometimento" field="nivel_comprometimento" options={comprometimentos} />
        <div className="space-y-1">
          <label className="label-micro">Observações internas</label>
          <textarea value={form.observacoes} onChange={e => update('observacoes', e.target.value)}
            rows={3} className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pb-4">
        <button onClick={handleSave} disabled={saving}
          className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 active:scale-[0.97] transition-all disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar liderança'}
        </button>
        <button onClick={() => navigate('/')}
          className="w-full h-12 border border-border rounded-xl text-muted-foreground font-medium active:scale-[0.97] transition-all">
          Cancelar
        </button>
      </div>
    </AppLayout>
  );
}
