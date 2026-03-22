import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Loader2 } from 'lucide-react';
import fernandaImg from '@/assets/fernanda-sarelli.jpg';

const Hyperspeed = lazy(() => import('@/components/Hyperspeed'));

export default function Login() {
  const { signIn } = useAuth();
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !password) {
      toast({ title: 'Preencha nome e senha', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signIn(nome, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao entrar', description: 'Nome ou senha incorretos', variant: 'destructive' });
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: '#070510', touchAction: 'manipulation' }}
    >
      {/* 3D Background */}
      <Suspense fallback={null}>
        <Hyperspeed />
      </Suspense>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm space-y-6">
        {/* Photo with online indicator */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-pink-500 to-rose-400 shadow-lg shadow-pink-500/30">
            <img
              src={fernandaImg}
              alt="Dra. Fernanda Sarelli"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {/* Online indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-[2.5px] border-[#070510] shadow-sm shadow-emerald-500/50" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Lideranças</h1>
          <p className="text-sm text-pink-400/70">Rede política – Dra. Fernanda Sarelli</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl p-6 space-y-4 border"
          style={{
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px hsl(340 82% 55% / 0.15)',
          }}
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest text-white/40 font-medium">
              Nome de usuário
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome de acesso"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                className="w-full h-12 pl-10 pr-4 rounded-xl text-white placeholder:text-white/25 outline-none transition-all focus:ring-2 focus:ring-pink-500/40"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest text-white/40 font-medium">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-12 pl-10 pr-4 rounded-xl text-white placeholder:text-white/25 outline-none transition-all focus:ring-2 focus:ring-pink-500/40"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          {/* Remember checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div
              onClick={() => setRemember(!remember)}
              className={`w-4.5 h-4.5 rounded-[5px] border flex items-center justify-center transition-all ${
                remember
                  ? 'bg-pink-500 border-pink-500'
                  : 'border-white/20 bg-white/5 group-hover:border-white/30'
              }`}
              style={{ width: 18, height: 18 }}
            >
              {remember && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Lembrar dados
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-[11px] text-white/20">v1.0 · Dra. Fernanda Sarelli</p>
      </div>
    </div>
  );
}
