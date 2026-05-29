import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
    Lock,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function PasswordChangePrompt() {
    const { user, refreshProfile } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            // 1. Update Auth Password
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;

            // 2. Update Profile in public.users
            if (user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .update({ senha_alterada: true })
                    .eq('uuid', user.id);

                if (profileError) {
                    console.error('Error updating profile:', profileError);
                    // Even if profile update fails, the password was changed.
                    // But we want to ensure the flag is set.
                }
            }

            setSuccess(true);

            // Wait a bit to show success message before refreshing
            setTimeout(async () => {
                await refreshProfile();
            }, 2000);

        } catch (err: any) {
            console.error('Password change error:', err);
            setError(err.message || 'Ocorreu um erro ao alterar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f0f0] flex flex-col font-sans relative overflow-x-hidden">
            {/* Header Section */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[#0E3A8C] rounded-b-[60px] z-0 shadow-xl overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-10 flex flex-col items-center text-center"
                >
                    <div className="w-20 h-20 bg-white/10 rounded-[30px] flex items-center justify-center backdrop-blur-md mb-6 border border-white/20 shadow-xl">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-white text-4xl font-black tracking-tight leading-none drop-shadow-md mb-4">Segurança ELTI</h1>
                    <div className="bg-brand-red text-white text-[10px] font-black px-6 py-2 rounded-full tracking-[0.3em] uppercase shadow-lg shadow-brand-red/20 inline-block">
                        Troca Obrigatória
                    </div>

                    <p className="text-blue-100 font-bold mt-8 max-w-xs leading-relaxed opacity-80">
                        Esta é a sua primeira vez acessando o painel. Por segurança, escolha uma senha nova e pessoal.
                    </p>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-white/50 relative overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 rounded-[28px] bg-green-50 flex items-center justify-center mb-8 shadow-inner">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h4 className="text-2xl font-black text-[#0E3A8C] mb-3">Senha Atualizada!</h4>
                                <p className="text-gray-400 font-bold text-sm">Tudo pronto! Você será redirecionado para o painel em instantes.</p>
                            </motion.div>
                        ) : (
                            <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-[24px] mb-8 text-xs font-black flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChange} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nova Senha</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                            <input
                                                type="password"
                                                required
                                                min={6}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[24px] py-5 pl-16 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirmar Nova Senha</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                            <input
                                                type="password"
                                                required
                                                min={6}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[24px] py-5 pl-16 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#0E3A8C] text-white font-black py-6 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Atualizar Senha
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <footer className="mt-12">
                    <p className="text-gray-400 font-black text-[10px] tracking-[0.4em] uppercase text-center opacity-50">
                        ELTI PLUS • GESTÃO E SEGURANÇA
                    </p>
                </footer>
            </div>
        </div>
    );
}
