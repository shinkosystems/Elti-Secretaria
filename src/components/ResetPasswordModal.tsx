import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordModalProps {
    onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const cleanPassword = password.trim();
        const cleanConfirm = confirmPassword.trim();

        if (cleanPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (cleanPassword !== cleanConfirm) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: cleanPassword,
            });

            if (updateError) throw updateError;

            setSuccessMessage('Senha redefinida com sucesso!');
            setTimeout(() => {
                sessionStorage.removeItem('elti_password_recovery');
                if (window.location.search || window.location.hash) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Erro ao redefinir senha:', err);
            setError(err.message || 'Ocorreu um erro ao atualizar sua senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xl p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-[40px] shadow-2xl border border-white/50">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-[#0E3A8C]/10 rounded-2xl flex items-center justify-center text-[#0E3A8C] mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0E3A8C] text-center">Redefinir Senha</h2>
                    <p className="text-gray-500 text-center text-sm mt-1">
                        Digite sua nova senha abaixo para concluir a recuperação.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl text-xs font-bold text-center">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-[#0E3A8C]/60 uppercase tracking-widest ml-4">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="w-full pl-6 pr-12 py-3.5 bg-gray-100 rounded-[30px] focus:outline-none focus:ring-2 focus:ring-[#0E3A8C]/30 text-gray-900 font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0E3A8C] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-[#0E3A8C]/60 uppercase tracking-widest ml-4">Confirmar Nova Senha</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full px-6 py-3.5 bg-gray-100 rounded-[30px] focus:outline-none focus:ring-2 focus:ring-[#0E3A8C]/30 text-gray-900 font-medium"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-[#ED1C24] text-white font-black h-14 rounded-[30px] hover:bg-opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center text-base uppercase tracking-widest"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Salvar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};
