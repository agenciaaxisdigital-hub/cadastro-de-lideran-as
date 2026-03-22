import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import fernandaImg from '@/assets/fernanda-sarelli.jpg';

const Hyperspeed = lazy(() => import('@/components/Hyperspeed'));

export default function Login() {
  const { signIn } = useAuth();
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      {/* 3D Highway Background */}
      <Suspense fallback={null}>
        <Hyperspeed />
      </Suspense>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm space-y-5">
        {/* Photo with online indicator */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-pink-500 to-rose-400 shadow-lg shadow-pink-500/30">
            <img
              src={fernandaImg}
              alt="Dra. Fernanda Sarelli"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-[2.5px] border-[#070510] shadow-sm shadow-emerald-500/50" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Dra. Fernanda Sarelli</h1>
          <p className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Cadastro de Lideranças</p>
          <p className="text-xs text-white/40">Acesso exclusivo da equipe</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl p-6 space-y-4 border border-white/[0.08]"
          style={{
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px hsl(340 82% 55% / 0.15)',
          }}
        >
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
              Usuário
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome de acesso"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                className="w-full h-13 pl-11 pr-4 rounded-xl text-white placeholder:text-white/25 outline-none transition-all focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '16px',
                  height: '52px',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
              Senha
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-11 pr-12 rounded-xl text-white placeholder:text-white/25 outline-none transition-all focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '16px',
                  height: '52px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <button
              type="button"
              onClick={() => setRemember(!remember)}
              className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
                remember
                  ? 'bg-pink-500 border-pink-500 shadow-sm shadow-pink-500/30'
                  : 'border-white/20 bg-white/5 group-hover:border-white/30'
              }`}
            >
              {remember && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Lembrar meus dados
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation', height: '50px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-0.5">
          <p className="text-[11px] text-white/25">Pré-candidata a Deputada Estadual — GO 2026</p>
          <p className="text-[11px] text-pink-400/40">drafernandasarelli.com.br</p>
        </div>
      </div>

      {/* Safe area bottom */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}
