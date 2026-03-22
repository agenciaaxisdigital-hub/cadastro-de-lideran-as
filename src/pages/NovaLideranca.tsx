import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, cleanCPF, validateCPF } from '@/lib/cpf';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';

const tiposLideranca = ['Comunitária', 'Religiosa', 'Sindical', 'Estudantil', 'Empresarial', 'Influenciador digital', 'Liderança de bairro', 'Coordenador regional', 'Outro'];
const niveis = ['Municipal', 'Zonal', 'Bairro', 'Rua', 'Comunitário', 'Outro'];
const origens = ['Indicação', 'Abordagem do agente', 'Evento', 'Redes sociais', 'Espontâneo', 'Outro'];
const statusOptions = ['Ativa', 'Potencial', 'Em negociação', 'Fraca', 'Descartada'];
const comprometimentos = ['Alto', 'Médio', 'Baixo'];
const situacoesTitulo = ['Regular', 'Cancelado', 'Suspenso', 'Não informado'];

export default function NovaLideranca() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [buscandoCPF, setBuscandoCPF] = useState(false);
  const [pessoaExistenteId, setPessoaExistenteId] = useState<string | null>(null);
  const [cpfEncontrado, setCpfEncontrado] = useState(false);
  const [liderancasExistentes, setLiderancasExistentes] = useState<{ id: string; nome: string }[]>([]);

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
    supabase.from('liderancas').select('id, pessoas(nome)').eq('status', 'Ativa')
      .then(({ data }) => {
        if (data) setLiderancasExistentes(data.map((l: any) => ({ id: l.id, nome: l.pessoas?.nome || '—' })));
      });
  }, []);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  // ===== BUSCA AUTOMÁTICA POR CPF =====
  const buscarPorCPF = async (cpfRaw: string) => {
    const cleaned = cleanCPF(cpfRaw);
    if (cleaned.length !== 11) return;
    if (!validateCPF(cleaned)) {
      toast({ title: 'CPF inválido', description: 'Verifique os números digitados', variant: 'destructive' });
      return;
    }

    setBuscandoCPF(true);
    setCpfEncontrado(false);
    setPessoaExistenteId(null);

    try {
      // Buscar no banco local
      const { data: pessoa } = await supabase
        .from('pessoas')
        .select('*')
        .eq('cpf', cleaned)
        .maybeSingle();

      if (pessoa) {
        // Preencher TODOS os campos automaticamente
        setForm(f => ({
          ...f,
          cpf: pessoa.cpf || cleaned,
          nome: pessoa.nome || f.nome,
          telefone: pessoa.telefone || f.telefone,
          whatsapp: pessoa.whatsapp || f.whatsapp,
          email: pessoa.email || f.email,
          instagram: pessoa.instagram || f.instagram,
          facebook: pessoa.facebook || f.facebook,
          titulo_eleitor: pessoa.titulo_eleitor || f.titulo_eleitor,
          zona_eleitoral: pessoa.zona_eleitoral || f.zona_eleitoral,
          secao_eleitoral: pessoa.secao_eleitoral || f.secao_eleitoral,
          municipio_eleitoral: pessoa.municipio_eleitoral || f.municipio_eleitoral,
          uf_eleitoral: pessoa.uf_eleitoral || f.uf_eleitoral,
          colegio_eleitoral: pessoa.colegio_eleitoral || f.colegio_eleitoral,
          endereco_colegio: pessoa.endereco_colegio || f.endereco_colegio,
          situacao_titulo: pessoa.situacao_titulo || f.situacao_titulo,
        }));
        setPessoaExistenteId(pessoa.id);
        setCpfEncontrado(true);
        toast({ title: '✅ Pessoa encontrada!', description: `Dados de ${pessoa.nome} preenchidos automaticamente` });
      } else {
        setForm(f => ({ ...f, cpf: cleaned }));
        toast({ title: 'CPF não encontrado na base', description: 'Preencha os dados manualmente' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoCPF(false);
    }
  };

  const handleCPFChange = (value: string) => {
    const cleaned = cleanCPF(value);
    update('cpf', cleaned);
    // Auto-buscar quando atingir 11 dígitos
    if (cleaned.length === 11) {
      buscarPorCPF(cleaned);
    } else {
      setCpfEncontrado(false);
      setPessoaExistenteId(null);
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast({ title: 'Preencha o nome', variant: 'destructive' }); return; }
    if (!form.telefone.trim() && !form.whatsapp.trim()) { toast({ title: 'Informe telefone ou WhatsApp', variant: 'destructive' }); return; }
    if (!form.tipo_lideranca) { toast({ title: 'Selecione o tipo de liderança', variant: 'destructive' }); return; }
    if (form.cpf && form.cpf.length === 11 && !validateCPF(form.cpf)) { toast({ title: 'CPF inválido', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      let pessoaId: string;

      if (pessoaExistenteId) {
        pessoaId = pessoaExistenteId;
        await supabase.from('pessoas').update({
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
          atualizado_em: new Date().toISOString(),
        }).eq('id', pessoaId);
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

      toast({ title: '✅ Liderança cadastrada com sucesso!' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ===== COMPONENTES INLINE =====
  const Field = ({ label, field, placeholder, type = 'text', required = false, readOnly = false }: {
    label: string; field: string; placeholder?: string; type?: string; required?: boolean; readOnly?: boolean;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${readOnly ? 'opacity-60' : ''}`}
      />
    </div>
  );

  const Select = ({ label, field, options, required = false }: {
    label: string; field: string; options: string[]; required?: boolean;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <select
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        className="w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      >
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const TextArea = ({ label, field, placeholder, rows = 2 }: {
    label: string; field: string; placeholder?: string; rows?: number;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={(form as any)[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
      />
    </div>
  );

  return (
    <AppLayout title="Nova Liderança" showNav={false}>
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 active:scale-95">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* ===== CPF — BUSCA RÁPIDA ===== */}
      <div className="section-card !space-y-2">
        <h2 className="section-title flex items-center gap-2">
          🔍 Buscar por CPF
          {cpfEncontrado && <CheckCircle2 size={16} className="text-emerald-500" />}
        </h2>
        <p className="text-xs text-muted-foreground -mt-1">
          Digite o CPF para buscar dados já cadastrados automaticamente
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatCPF(form.cpf)}
            onChange={e => handleCPFChange(e.target.value)}
            placeholder="000.000.000-00"
            className="flex-1 h-12 px-4 bg-card border border-border rounded-xl text-base text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={14}
          />
          <button
            onClick={() => buscarPorCPF(form.cpf)}
            disabled={buscandoCPF || form.cpf.length < 11}
            className="h-12 w-12 gradient-primary text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          >
            {buscandoCPF ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>
        {cpfEncontrado && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✅ Dados preenchidos automaticamente
          </p>
        )}
      </div>

      {/* ===== DADOS PESSOAIS ===== */}
      <div className="section-card">
        <h2 className="section-title">👤 Dados Pessoais</h2>
        <Field label="Nome completo" field="nome" required placeholder="Nome da liderança" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone" field="telefone" placeholder="(00) 0000-0000" type="tel" />
          <Field label="WhatsApp" field="whatsapp" placeholder="(00) 00000-0000" type="tel" />
        </div>
        <Field label="E-mail" field="email" type="email" placeholder="email@exemplo.com" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram" field="instagram" placeholder="@usuario" />
          <Field label="Facebook" field="facebook" placeholder="Nome ou link" />
        </div>
      </div>

      {/* ===== DADOS ELEITORAIS ===== */}
      <div className="section-card">
        <h2 className="section-title">🗳️ Dados Eleitorais</h2>
        <p className="text-xs text-muted-foreground -mt-1">Informações importantes para a campanha</p>
        <Field label="Título de eleitor" field="titulo_eleitor" placeholder="Número do título" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Zona eleitoral" field="zona_eleitoral" placeholder="Ex: 045" />
          <Field label="Seção eleitoral" field="secao_eleitoral" placeholder="Ex: 0123" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Município eleitoral" field="municipio_eleitoral" placeholder="Cidade" />
          </div>
          <Field label="UF" field="uf_eleitoral" placeholder="GO" />
        </div>
        <Field label="Colégio eleitoral" field="colegio_eleitoral" placeholder="Nome da escola / local de votação" />
        <TextArea label="Endereço do colégio" field="endereco_colegio" placeholder="Rua, número, bairro..." />
        <Select label="Situação do título" field="situacao_titulo" options={situacoesTitulo} />
      </div>

      {/* ===== PERFIL + STATUS (simplificado) ===== */}
      <div className="section-card">
        <h2 className="section-title">⭐ Perfil e Status</h2>
        <Select label="Tipo de liderança" field="tipo_lideranca" options={tiposLideranca} required />
        <Select label="Nível" field="nivel" options={niveis} />
        <TextArea label="Região de atuação" field="regiao_atuacao" placeholder="Bairro X, Comunidade Y..." />
        <Field label="Zona de atuação" field="zona_atuacao" placeholder="Zona onde mais atua" />
        <TextArea label="Bairros de influência" field="bairros_influencia" placeholder="Separados por vírgula" />
        <TextArea label="Comunidades de influência" field="comunidades_influencia" placeholder="Separados por vírgula" />
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Liderança principal (superior)</label>
          <select value={form.lider_principal_id} onChange={e => update('lider_principal_id', e.target.value)}
            className="w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Nenhuma</option>
            {liderancasExistentes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <Select label="Origem da captação" field="origem_captacao" options={origens} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Apoiadores estimados" field="apoiadores_estimados" type="number" placeholder="0" />
          <Field label="Meta de votos" field="meta_votos" type="number" placeholder="0" />
        </div>
        <Select label="Status" field="status" options={statusOptions} required />
        <Select label="Comprometimento" field="nivel_comprometimento" options={comprometimentos} />
        <TextArea label="Observações internas" field="observacoes" rows={3} placeholder="Anotações sobre esta liderança..." />
      </div>

      {/* ===== BOTÕES ===== */}
      <div className="space-y-3 pb-6">
        <button onClick={handleSave} disabled={saving}
          className="w-full h-14 gradient-primary text-white text-base font-semibold rounded-2xl shadow-lg shadow-pink-500/25 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={20} className="animate-spin" /> Salvando...</> : '✅ Salvar Liderança'}
        </button>
        <button onClick={() => navigate('/')}
          className="w-full h-12 border border-border rounded-xl text-muted-foreground font-medium active:scale-[0.97] transition-all">
          Cancelar
        </button>
      </div>
    </AppLayout>
  );
}
