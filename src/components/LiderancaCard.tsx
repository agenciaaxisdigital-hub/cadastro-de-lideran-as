import { UserCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Props {
  nome: string;
  status: string;
  tipo_lideranca?: string | null;
  nivel?: string | null;
  zona_atuacao?: string | null;
  municipio_eleitoral?: string | null;
  apoiadores_estimados?: number | null;
  cadastrado_por_nome?: string | null;
  showAgent?: boolean;
  onClick?: () => void;
}

export default function LiderancaCard({
  nome, status, tipo_lideranca, nivel, zona_atuacao,
  municipio_eleitoral, apoiadores_estimados, cadastrado_por_nome,
  showAgent, onClick
}: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left section-card hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <UserCircle size={20} className="text-primary" />
          </div>
          <span className="font-semibold text-foreground truncate">{nome}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5 ml-[46px]">
        {(tipo_lideranca || nivel) && (
          <p>
            {tipo_lideranca && <>Tipo: {tipo_lideranca}</>}
            {tipo_lideranca && nivel && ' · '}
            {nivel && <>Nível: {nivel}</>}
          </p>
        )}
        {(zona_atuacao || municipio_eleitoral) && (
          <p>
            {zona_atuacao && <>Zona: {zona_atuacao}</>}
            {zona_atuacao && municipio_eleitoral && ' · '}
            {municipio_eleitoral && <>Munic.: {municipio_eleitoral}</>}
          </p>
        )}
        {apoiadores_estimados != null && apoiadores_estimados > 0 && (
          <p>Apoiadores estimados: {apoiadores_estimados}</p>
        )}
        {showAgent && cadastrado_por_nome && (
          <p className="text-micro text-primary/70">Cadastrada por: {cadastrado_por_nome}</p>
        )}
      </div>
    </button>
  );
}
