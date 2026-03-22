import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import fernandaImg from '@/assets/fernanda-sarelli.jpg';

export default function Login() {
  const { signIn } = useAuth();
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #070510 0%, #0f0a1a 50%, #120818 100%)' }}>
      
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(340 82% 55%) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm space-y-6">
        {/* Photo */}
        <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-pink-500 to-rose-400">
          <img src={fernandaImg} alt="Dra. Fernanda Sarelli"
            className="w-full h-full rounded-full object-cover" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">Lideranças</h1>
          <p className="text-sm text-white/50">Rede política – Dra. Fernanda Sarelli</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="label-micro text-white/40">Nome de usuário</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome de acesso"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-micro text-white/40">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-[11px] text-white/30">v1.0 · Dra. Fernanda Sarelli</p>
      </div>
    </div>
  );
}
