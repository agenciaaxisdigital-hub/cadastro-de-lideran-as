import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
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
  const [validandoCPF, setValidandoCPF] = useState(false);
  const [cpfStatus, setCpfStatus] = useState<'idle' | 'validando' | 'confirmado'>('idle');
  const [cpfNomePessoa, setCpfNomePessoa] = useState('');
  const [pessoaExistenteId, setPessoaExistenteId] = useState<string | null>(null);
  const [liderancasExistentes, setLiderancasExistentes] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    supabase.from('liderancas').select('id, pessoas(nome)').eq('status', 'Ativa')
      .then(({ data }) => {
        if (data) setLiderancasExistentes(data.map((l: any) => ({ id: l.id, nome: l.pessoas?.nome || '—' })));
      });
  }, []);

  const update = useCallback((field: string, value: string) => setForm(f => ({ ...f, [field]: value })), []);
  const cpfTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quando CPF completo, busca local + valida na API
  const validarCPF = useCallback(async (cpfClean: string) => {
    if (cpfClean.length !== 11 || !validateCPF(cpfClean)) {
      if (cpfClean.length === 11) toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    if (validandoCPF) return;
    setValidandoCPF(true);
    setCpfStatus('validando');
    setCpfNomeAPI('');
    setPessoaExistenteId(null);
    try {
      // 1) Busca local — preenche tudo se já cadastrado
      const { data: pessoa } = await supabase.from('pessoas').select('*').eq('cpf', cpfClean).maybeSingle();
      if (pessoa) {
        setForm(f => ({
          ...f, cpf: pessoa.cpf || cpfClean,
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
        setCpfStatus('confirmado');
        setCpfNomeAPI(pessoa.nome);
        toast({ title: '✅ Pessoa já cadastrada!', description: `Dados de ${pessoa.nome} preenchidos` });
        return;
      }

      // 2) Valida na API externa — apenas confirma nome
      try {
        const { data: apiData, error: fnError } = await supabase.functions.invoke('consultar-cpf', {
          body: { cpf: cpfClean },
        });
        if (!fnError && apiData?.found && apiData.nome) {
          setCpfNomeAPI(apiData.nome);
          // Compara nome digitado com nome da API
          const nomeForm = form.nome.trim().toLowerCase();
          const nomeApi = apiData.nome.trim().toLowerCase();
          if (!nomeForm || nomeApi.includes(nomeForm) || nomeForm.includes(nomeApi)) {
            setCpfStatus('confirmado');
          } else {
            setCpfStatus('divergente');
          }
          return;
        }
      } catch (apiErr) {
        console.warn('API externa indisponível:', apiErr);
      }

      setCpfStatus('nao_encontrado');
    } catch (err) { console.error(err); }
    finally { setValidandoCPF(false); }
  }, [validandoCPF, form.nome]);

  const handleCPFChange = (value: string) => {
    const cleaned = cleanCPF(value);
    update('cpf', cleaned);
    setCpfStatus('idle');
    setCpfNomeAPI('');
    setPessoaExistenteId(null);
    if (cpfTimeoutRef.current) clearTimeout(cpfTimeoutRef.current);
    if (cleaned.length === 11) {
      cpfTimeoutRef.current = setTimeout(() => validarCPF(cleaned), 500);
    }
  };

  // Re-validar quando nome muda e CPF já está completo
  const handleNomeChange = (value: string) => {
    update('nome', value);
    if (cpfNomeAPI && form.cpf.length === 11) {
      const nomeApi = cpfNomeAPI.trim().toLowerCase();
      const nomeDigitado = value.trim().toLowerCase();
      if (!nomeDigitado || nomeApi.includes(nomeDigitado) || nomeDigitado.includes(nomeApi)) {
        setCpfStatus('confirmado');
      } else {
        setCpfStatus('divergente');
      }
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
      setCpfStatus('idle');
      setCpfNomeAPI('');
      onSaved();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full h-11 px-3 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  const selectCls = inputCls;
  const textareaCls = "w-full px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none";

  const cpfBorderCls = cpfStatus === 'confirmado' ? 'border-emerald-500 ring-1 ring-emerald-500/30'
    : cpfStatus === 'divergente' ? 'border-amber-500 ring-1 ring-amber-500/30'
    : '';

  return (
    <div className="space-y-4 pb-24">
      {/* Dados Pessoais */}
      <div className="section-card">
        <h2 className="section-title">👤 Dados Pessoais</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome completo <span className="text-primary">*</span></label>
          <input type="text" value={form.nome} onChange={e => handleNomeChange(e.target.value)} placeholder="Nome da liderança" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            CPF
            {cpfStatus === 'validando' && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
            {cpfStatus === 'confirmado' && <CheckCircle2 size={12} className="text-emerald-500" />}
            {cpfStatus === 'divergente' && <AlertCircle size={12} className="text-amber-500" />}
          </label>
          <input type="text" inputMode="numeric" value={formatCPF(form.cpf)}
            onChange={e => handleCPFChange(e.target.value)} placeholder="000.000.000-00"
            className={`${inputCls} ${cpfBorderCls}`}
            maxLength={14} />
          {cpfStatus === 'confirmado' && cpfNomeAPI && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✅ CPF confirmado: {cpfNomeAPI}</p>
          )}
          {cpfStatus === 'divergente' && cpfNomeAPI && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠️ Nome na Receita: {cpfNomeAPI} — verifique se está correto</p>
          )}
          {cpfStatus === 'nao_encontrado' && (
            <p className="text-xs text-muted-foreground">CPF não encontrado na base externa</p>
          )}
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
