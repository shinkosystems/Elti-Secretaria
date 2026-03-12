import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onSuccess: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'login') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) throw authError;

        if (authData.user) {
          // Fetch user type from public.users table
          // Note: Using 'uuid' as the column name for the Auth ID based on the reference code provided.
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tipousuario')
            .eq('uuid', authData.user.id)
            .single();

          if (userError) {
            console.error('Permission check error:', userError);
            await supabase.auth.signOut();
            throw new Error('Erro ao verificar permissões de acesso. Verifique se seu perfil está configurado corretamente.');
          }

          const allowedTypes = ['Manager', 'Secretary'];
          if (!allowedTypes.includes(userData?.tipousuario)) {
            await supabase.auth.signOut();
            throw new Error('Acesso negado. Apenas Gerentes e Secretários podem acessar este módulo.');
          }
        }
        
        onSuccess();
      } else if (view === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar.');
        setView('login');
      } else if (view === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Se este e-mail estiver registrado, você receberá um link de recuperação em breve.');
        setView('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col font-sans relative overflow-x-hidden">
      {/* Header Section */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] bg-[#0E3A8C] rounded-b-[60px] z-0 shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '24px 24px' }}></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 flex flex-col items-center"
        >
          <h1 className="text-white text-7xl font-black tracking-tighter leading-none drop-shadow-md">ELTI</h1>
          <div className="bg-brand-red text-white text-xs font-black px-6 py-2 rounded-full mt-4 tracking-[0.4em] uppercase shadow-lg shadow-brand-red/20">
            Secretaria
          </div>
          
          <p className="text-blue-100 font-bold mt-8 uppercase tracking-widest text-[10px] opacity-90">
            {view === 'login' ? 'Acesso Administrativo' : view === 'register' ? 'Criar Nova Conta' : 'Recuperar Senha'}
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border border-white/50"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15h1.14a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 0010.253 9H9z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F3F4F6] border-none rounded-3xl p-5 text-brand font-medium placeholder:text-brand/30 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
              placeholder="Endereço de E-mail"
            />
            
            {view !== 'forgotPassword' && (
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F3F4F6] border-none rounded-3xl p-5 text-brand font-medium placeholder:text-brand/30 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                placeholder="Senha"
              />
            )}

            {view === 'register' && (
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#F3F4F6] border-none rounded-3xl p-5 text-brand font-medium placeholder:text-brand/30 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                placeholder="Confirmar Senha"
              />
            )}

            {view === 'login' && (
              <div className="flex justify-end px-2">
                <button 
                  type="button"
                  onClick={() => { setView('forgotPassword'); setError(null); setMessage(null); }}
                  className="text-xs font-black text-[#0E3A8C] uppercase tracking-widest hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-red text-white font-black py-5 rounded-3xl shadow-lg shadow-brand-red/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center mt-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (view === 'login' ? 'Entrar' : view === 'register' ? 'Cadastrar' : 'Enviar Link')}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 w-full">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ou</span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <button 
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setError(null);
                setMessage(null);
              }}
              className="text-sm font-bold text-gray-500 hover:text-[#0E3A8C] transition-colors"
            >
              {view === 'login' ? "Não tem uma conta? Crie uma" : "Já tem uma conta? Entre agora"}
            </button>
          </div>
        </motion.div>

        <footer className="mt-10">
          <p className="text-brand/30 font-black text-[10px] tracking-[0.3em] uppercase text-center">
            ELTI PLUS APRENDIZADO DE INGLÊS
          </p>
        </footer>
      </div>
    </div>
  );
}
