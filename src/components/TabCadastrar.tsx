import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, cleanCPF, validateCPF } from '@/lib/cpf';
import { toast } from '@/hooks/use-toast';

const tiposLideranca = ['Comunitária', 'Religiosa', 'Sindical', 'Estudantil', 'Empresarial', 'Influenciador digital', 'Liderança de bairro', 'Coordenador regional', 'Outro'];
const niveis = ['Municipal', 'Zonal', 'Bairro', 'Rua', 'Comunitário', 'Outro'];
const origens = ['Indicação', 'Abordagem do agente', 'Evento', 'Redes sociais', 'Espontâneo', 'Outro'];
const statusOptions = ['Ativa', 'Potencial', 'Em negociação', 'Fraca', 'Descartada'];
const comprometimentos = ['Alto', 'Médio', 'Baixo'];
const situacoesTitulo = ['Regular', 'Cancelado', 'Suspenso', 'Não informado'];

const emptyForm = {
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
};

interface Props {
  onSaved: () => void;
}

export default function TabCadastrar({ onSaved }: Props) {
  const { usuario } = useAuth();
  const [saving, setSaving] = useState(false);
  const [buscandoCPF, setBuscandoCPF] = useState(false);
  const [pessoaExistenteId, setPessoaExistenteId] = useState<string | null>(null);
  const [cpfEncontrado, setCpfEncontrado] = useState(false);
  const [liderancasExistentes, setLiderancasExistentes] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    supabase.from('liderancas').select('id, pessoas(nome)').eq('status', 'Ativa')
      .then(({ data }) => {
        if (data) setLiderancasExistentes(data.map((l: any) => ({ id: l.id, nome: l.pessoas?.nome || '—' })));
      });
  }, []);

  const update = useCallback((field: string, value: string) => setForm(f => ({ ...f, [field]: value })), []);

  const buscarPorCPF = useCallback(async (cpfRaw: string) => {
    const cleaned = cleanCPF(cpfRaw);
    if (cleaned.length !== 11) return;
    if (!validateCPF(cleaned)) {
      toast({ title: 'CPF inválido', description: 'Verifique os números digitados', variant: 'destructive' });
      return;
    }
    if (buscandoCPF) return;
    setBuscandoCPF(true);
    setCpfEncontrado(false);
    setPessoaExistenteId(null);
    try {
      // 1) Busca local
      const { data: pessoa } = await supabase.from('pessoas').select('*').eq('cpf', cleaned).maybeSingle();
      if (pessoa) {
        setForm(f => ({
          ...f, cpf: pessoa.cpf || cleaned,
          nome: pessoa.nome || f.nome, telefone: pessoa.telefone || f.telefone,
          whatsapp: pessoa.whatsapp || f.whatsapp, email: pessoa.email || f.email,
          instagram: pessoa.instagram || f.instagram, facebook: pessoa.facebook || f.facebook,
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
        toast({ title: '✅ Pessoa encontrada na base!', description: `Dados de ${pessoa.nome} preenchidos` });
        return;
      }

      // 2) Busca na API externa (cpf-brasil.org)
      try {
        const { data: apiData, error: fnError } = await supabase.functions.invoke('consultar-cpf', {
          body: { cpf: cleaned },
        });
        if (!fnError && apiData?.found && apiData.nome) {
          setForm(f => ({
            ...f,
            cpf: cleaned,
            nome: apiData.nome || f.nome,
          }));
          setCpfEncontrado(true);
          toast({ title: '✅ CPF encontrado!', description: `Nome: ${apiData.nome} (dados da Receita Federal)` });
          return;
        }
      } catch (apiErr) {
        console.warn('API externa indisponível:', apiErr);
      }

      // 3) Nenhum resultado
      setForm(f => ({ ...f, cpf: cleaned }));
      toast({ title: 'CPF não encontrado', description: 'Preencha os dados manualmente' });
    } catch (err) { console.error(err); }
    finally { setBuscandoCPF(false); }
  }, [buscandoCPF]);

  const cpfTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCPFChange = (value: string) => {
    const cleaned = cleanCPF(value);
    update('cpf', cleaned);
    setCpfEncontrado(false);
    setPessoaExistenteId(null);
    if (cpfTimeoutRef.current) clearTimeout(cpfTimeoutRef.current);
    if (cleaned.length === 11) {
      cpfTimeoutRef.current = setTimeout(() => buscarPorCPF(cleaned), 400);
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
          nome: form.nome, telefone: form.telefone || null, whatsapp: form.whatsapp || null,
          email: form.email || null, instagram: form.instagram || null, facebook: form.facebook || null,
          titulo_eleitor: form.titulo_eleitor || null, zona_eleitoral: form.zona_eleitoral || null,
          secao_eleitoral: form.secao_eleitoral || null, municipio_eleitoral: form.municipio_eleitoral || null,
          uf_eleitoral: form.uf_eleitoral || null, colegio_eleitoral: form.colegio_eleitoral || null,
          endereco_colegio: form.endereco_colegio || null, situacao_titulo: form.situacao_titulo || null,
          atualizado_em: new Date().toISOString(),
        }).eq('id', pessoaId);
      } else {
        const { data: novaPessoa, error } = await supabase.from('pessoas').insert({
          cpf: form.cpf || null, nome: form.nome, telefone: form.telefone || null,
          whatsapp: form.whatsapp || null, email: form.email || null,
          instagram: form.instagram || null, facebook: form.facebook || null,
          titulo_eleitor: form.titulo_eleitor || null, zona_eleitoral: form.zona_eleitoral || null,
          secao_eleitoral: form.secao_eleitoral || null, municipio_eleitoral: form.municipio_eleitoral || null,
          uf_eleitoral: form.uf_eleitoral || null, colegio_eleitoral: form.colegio_eleitoral || null,
          endereco_colegio: form.endereco_colegio || null, situacao_titulo: form.situacao_titulo || null,
        }).select('id').single();
        if (error) throw error;
        pessoaId = novaPessoa!.id;
      }

      const { error: lError } = await supabase.from('liderancas').insert({
        pessoa_id: pessoaId, tipo_lideranca: form.tipo_lideranca || null,
        nivel: form.nivel || null, regiao_atuacao: form.regiao_atuacao || null,
        zona_atuacao: form.zona_atuacao || null, bairros_influencia: form.bairros_influencia || null,
        comunidades_influencia: form.comunidades_influencia || null,
        lider_principal_id: form.lider_principal_id || null,
        origem_captacao: form.origem_captacao || null,
        apoiadores_estimados: form.apoiadores_estimados ? parseInt(form.apoiadores_estimados) : null,
        meta_votos: form.meta_votos ? parseInt(form.meta_votos) : null,
        status: form.status, nivel_comprometimento: form.nivel_comprometimento || null,
        observacoes: form.observacoes || null, cadastrado_por: usuario?.id || null,
      });
      if (lError) throw lError;

      toast({ title: '✅ Liderança cadastrada com sucesso!' });
      setForm({ ...emptyForm });
      setPessoaExistenteId(null);
      setCpfEncontrado(false);
      onSaved();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  const selectCls = inputCls;
  const textareaCls = "w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none";

  return (
    <div className="space-y-4 pb-24">
      {/* CPF Search */}
      <div className="section-card !space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title">🔍 CPF</h2>
          {cpfEncontrado && <CheckCircle2 size={14} className="text-emerald-500" />}
        </div>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" value={formatCPF(form.cpf)}
            onChange={e => handleCPFChange(e.target.value)} placeholder="000.000.000-00"
            className="flex-1 h-12 px-4 bg-card border border-border rounded-xl text-base text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={14} />
          <button onClick={() => buscarPorCPF(form.cpf)}
            disabled={buscandoCPF || form.cpf.length < 11}
            className="h-12 w-12 gradient-primary text-white rounded-xl flex items-center justify-center active:scale-90 disabled:opacity-40">
            {buscandoCPF ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>
        {cpfEncontrado && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Dados preenchidos automaticamente</p>}
      </div>

      {/* Dados Pessoais */}
      <div className="section-card">
        <h2 className="section-title">👤 Dados Pessoais</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome completo <span className="text-primary">*</span></label>
          <input type="text" value={form.nome} onChange={e => update('nome', e.target.value)} placeholder="Nome da liderança" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Telefone</label>
            <input type="tel" value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
            <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Instagram</label>
            <input type="text" value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@usuario" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Facebook</label>
            <input type="text" value={form.facebook} onChange={e => update('facebook', e.target.value)} placeholder="Nome ou link" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Dados Eleitorais */}
      <div className="section-card">
        <h2 className="section-title">🗳️ Dados Eleitorais</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Título de eleitor</label>
          <input type="text" value={form.titulo_eleitor} onChange={e => update('titulo_eleitor', e.target.value)} placeholder="Número do título" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Zona</label>
            <input type="text" value={form.zona_eleitoral} onChange={e => update('zona_eleitoral', e.target.value)} placeholder="045" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Seção</label>
            <input type="text" value={form.secao_eleitoral} onChange={e => update('secao_eleitoral', e.target.value)} placeholder="0123" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Município</label>
            <input type="text" value={form.municipio_eleitoral} onChange={e => update('municipio_eleitoral', e.target.value)} placeholder="Cidade" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">UF</label>
            <input type="text" value={form.uf_eleitoral} onChange={e => update('uf_eleitoral', e.target.value)} placeholder="GO" className={inputCls} maxLength={2} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Colégio eleitoral</label>
          <input type="text" value={form.colegio_eleitoral} onChange={e => update('colegio_eleitoral', e.target.value)} placeholder="Nome da escola / local" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Endereço colégio</label>
          <textarea value={form.endereco_colegio} onChange={e => update('endereco_colegio', e.target.value)} rows={2} placeholder="Rua, número, bairro..." className={textareaCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Situação do título</label>
          <select value={form.situacao_titulo} onChange={e => update('situacao_titulo', e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {situacoesTitulo.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Perfil + Status */}
      <div className="section-card">
        <h2 className="section-title">⭐ Perfil e Status</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo <span className="text-primary">*</span></label>
          <select value={form.tipo_lideranca} onChange={e => update('tipo_lideranca', e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {tiposLideranca.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nível</label>
          <select value={form.nivel} onChange={e => update('nivel', e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {niveis.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Região de atuação</label>
          <textarea value={form.regiao_atuacao} onChange={e => update('regiao_atuacao', e.target.value)} rows={2} placeholder="Bairro X, Comunidade Y..." className={textareaCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Zona de atuação</label>
          <input type="text" value={form.zona_atuacao} onChange={e => update('zona_atuacao', e.target.value)} placeholder="Zona onde mais atua" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Bairros de influência</label>
          <textarea value={form.bairros_influencia} onChange={e => update('bairros_influencia', e.target.value)} rows={2} placeholder="Separados por vírgula" className={textareaCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Comunidades</label>
          <textarea value={form.comunidades_influencia} onChange={e => update('comunidades_influencia', e.target.value)} rows={2} placeholder="Separados por vírgula" className={textareaCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Liderança principal</label>
          <select value={form.lider_principal_id} onChange={e => update('lider_principal_id', e.target.value)} className={selectCls}>
            <option value="">Nenhuma</option>
            {liderancasExistentes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Origem</label>
          <select value={form.origem_captacao} onChange={e => update('origem_captacao', e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {origens.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Apoiadores</label>
            <input type="number" value={form.apoiadores_estimados} onChange={e => update('apoiadores_estimados', e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Meta votos</label>
            <input type="number" value={form.meta_votos} onChange={e => update('meta_votos', e.target.value)} placeholder="0" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status <span className="text-primary">*</span></label>
            <select value={form.status} onChange={e => update('status', e.target.value)} className={selectCls}>
              {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Comprometimento</label>
            <select value={form.nivel_comprometimento} onChange={e => update('nivel_comprometimento', e.target.value)} className={selectCls}>
              <option value="">Selecione...</option>
              {comprometimentos.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Observações</label>
          <textarea value={form.observacoes} onChange={e => update('observacoes', e.target.value)} rows={3} placeholder="Anotações..." className={textareaCls} />
        </div>
      </div>

      {/* Botão Salvar */}
      <button onClick={handleSave} disabled={saving}
        className="w-full h-14 gradient-primary text-white text-base font-semibold rounded-2xl shadow-lg shadow-pink-500/25 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader2 size={20} className="animate-spin" /> Salvando...</> : '✅ Salvar Liderança'}
      </button>
    </div>
  );
}
