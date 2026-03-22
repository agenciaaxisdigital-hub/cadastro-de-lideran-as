import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield, User } from 'lucide-react';

export default function TabPerfil() {
  const { usuario, signOut } = useAuth();

  return (
    <div className="space-y-4 pb-24">
      <div className="section-card flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
          {usuario?.tipo === 'admin' ? <Shield size={28} className="text-white" /> : <User size={28} className="text-white" />}
        </div>
        <h2 className="text-lg font-bold text-foreground mt-3">{usuario?.nome || '—'}</h2>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider mt-1">
          {usuario?.tipo === 'admin' ? 'Administrador' : 'Agente de Campo'}
        </span>
      </div>

      <button onClick={signOut}
        className="w-full h-12 border border-destructive/30 rounded-xl text-destructive font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
        <LogOut size={18} /> Sair
      </button>

      <p className="text-center text-[10px] text-muted-foreground">v1.0 · Lideranças – Dra. Fernanda Sarelli</p>
    </div>
  );
}
