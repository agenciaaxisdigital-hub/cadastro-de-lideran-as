import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import LiderancaCard from '@/components/LiderancaCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Busca() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearched(true);
    const term = `%${query.trim()}%`;
    const { data } = await supabase
      .from('liderancas')
      .select('id, status, tipo_lideranca, nivel, zona_atuacao, apoiadores_estimados, cadastrado_por, pessoas!inner(nome, cpf, telefone, municipio_eleitoral, titulo_eleitor), usuarios(nome)')
      .or(`nome.ilike.${term},cpf.ilike.${term},telefone.ilike.${term},titulo_eleitor.ilike.${term}`, { referencedTable: 'pessoas' })
      .limit(50);
    setResults(data || []);
  };

  return (
    <AppLayout title="Buscar" subtitle="Encontre lideranças por nome, CPF, telefone ou título">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Buscar por nome, CPF, telefone..."
          className="flex-1 h-12 px-4 bg-card border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={search}
          className="h-12 px-4 gradient-primary text-white rounded-xl active:scale-95 transition-transform">
          <SearchIcon size={18} />
        </button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado encontrado</p>
      )}

      <div className="space-y-3">
        {results.map((l: any) => (
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
    </AppLayout>
  );
}
