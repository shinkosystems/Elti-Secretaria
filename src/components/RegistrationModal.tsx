import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, UserPlus, Mail, Loader2, CheckCircle, User, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    fk_colegio: number | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function RegistrationModal({ isOpen, onClose, fk_colegio }: RegistrationModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [uf, setUf] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [responsavelFinanceiro, setResponsavelFinanceiro] = useState('');
    const [cpfResponsavelFinanceiro, setCpfResponsavelFinanceiro] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCepBlur = async () => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;

        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setLogradouro(data.logradouro);
                setBairro(data.bairro);
                setCidade(data.localidade);
                setUf(data.uf);

                // Focus on numbering field after a short delay
                setTimeout(() => {
                    const numeroInput = document.getElementById('num_input');
                    if (numeroInput) numeroInput.focus();
                }, 100);
            } else {
                setError('CEP não encontrado.');
            }
        } catch (err) {
            console.error('Error fetching CEP:', err);
        } finally {
            setLoadingCep(false);
        }
    };


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create a temporary Supabase client to avoid signing out the current user
            const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            // 2. Sign up the new user in Auth
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email,
                password: 'alunoelti',
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        tipousuario: 'Student'
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Não foi possível criar o usuário no sistema de autenticação.');

            // 3. Create the user profile in public.users
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    uuid: authData.user.id,
                    nome: `${firstName} ${lastName}`,
                    email: email,
                    tipousuario: 'Student',
                    fk_colegio: fk_colegio,
                    cep,
                    logradouro,
                    bairro,
                    cidade,
                    uf,
                    numero,
                    complemento,
                    responsavel_financeiro: responsavelFinanceiro || null,
                    cpf_responsavel_financeiro: cpfResponsavelFinanceiro || null,
                    coins: 0,
                    criado_secretaria: true,
                    senha_alterada: false
                });


            if (profileError) {
                console.error('Error creating public profile:', profileError);
                // We don't delete the auth user here as we don't have admin rights, 
                // but the record will be created in auth.users anyway.
                throw new Error('Usuário autenticado, mas erro ao criar perfil na base de dados. Verifique com o suporte.');
            }

            setSuccess(true);
            setTimeout(() => {
                setFirstName('');
                setLastName('');
                setEmail('');
                setCep('');
                setLogradouro('');
                setBairro('');
                setCidade('');
                setUf('');
                setNumero('');
                setComplemento('');
                setResponsavelFinanceiro('');
                setCpfResponsavelFinanceiro('');
                setSuccess(false);
                onClose();
            }, 2000);


        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocorreu um erro ao realizar a matrícula.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#0E3A8C]/30 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden border border-white"
                    >

                        {/* Header */}
                        <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px] shrink-0">
                            {/* Dot Pattern */}
                            <div
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <button
                                onClick={onClose}
                                className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <div className="flex items-center gap-6 mb-2 relative z-10">
                                <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                    <UserPlus className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Nova Matrícula</h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleRegister} className="p-10 space-y-8">

                                {success ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-16 flex flex-col items-center text-center"
                                    >
                                        <div className="w-24 h-24 rounded-[32px] bg-green-50 flex items-center justify-center mb-8 shadow-inner shadow-green-100/50">
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                        </div>
                                        <h4 className="text-2xl font-black text-[#0E3A8C] mb-3 leading-tight">Matrícula Realizada com Sucesso!</h4>
                                        <p className="text-gray-400 font-bold text-sm max-w-[280px]">O aluno já pode acessar o portal ELTI utilizando os dados abaixo.</p>
                                        <div className="mt-8 px-6 py-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Senha padrão de acesso</p>
                                            <p className="text-lg font-black text-[#0E3A8C] tracking-widest">alunoelti</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <>
                                        {error && (
                                            <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-[24px] text-xs font-bold ripple-red flex items-center gap-4 shadow-sm">
                                                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                                    <AlertCircle className="w-5 h-5" />
                                                </div>
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Primeiro Nome</label>
                                                <div className="relative group">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Ana"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Último Nome</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Silva"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Endereço de E-mail</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="exemplo@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Responsável Financeiro</label>
                                                <div className="relative group">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                                    <input
                                                        type="text"
                                                        placeholder="Opcional"
                                                        value={responsavelFinanceiro}
                                                        onChange={(e) => setResponsavelFinanceiro(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">CPF do Resp. Financeiro</label>
                                                <input
                                                    type="text"
                                                    placeholder="Opcional"
                                                    value={cpfResponsavelFinanceiro}
                                                    onChange={(e) => setCpfResponsavelFinanceiro(e.target.value)}
                                                    className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                />
                                            </div>
                                        </div>

                                        {/* Address Section */}
                                        <div className="space-y-6 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-1 h-4 bg-[#0E3A8C] rounded-full" />
                                                <h4 className="text-xs font-black text-[#0E3A8C] uppercase tracking-widest">Endereço Residencial</h4>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">CEP</label>
                                                    <div className="relative group">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="00000-000"
                                                            value={cep}
                                                            onChange={(e) => setCep(e.target.value)}
                                                            onBlur={handleCepBlur}
                                                            className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                        />
                                                        {loadingCep && (
                                                            <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0E3A8C] animate-spin" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Logradouro (Rua/Av)</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Rua das Flores"
                                                        value={logradouro}
                                                        onChange={(e) => setLogradouro(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Número</label>
                                                    <input
                                                        id="num_input"
                                                        type="text"
                                                        required
                                                        placeholder="123"
                                                        value={numero}
                                                        onChange={(e) => setNumero(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Complemento</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Apt 101"
                                                        value={complemento}
                                                        onChange={(e) => setComplemento(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Bairro</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Centro"
                                                        value={bairro}
                                                        onChange={(e) => setBairro(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Cidade</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="São Paulo"
                                                        value={cidade}
                                                        onChange={(e) => setCidade(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">UF</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="SP"
                                                        value={uf}
                                                        onChange={(e) => setUf(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>


                                        <div className="bg-[#0E3A8C]/5 rounded-[24px] p-6 border border-[#0E3A8C]/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0E3A8C] shadow-sm">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Segurança</p>
                                                    <p className="text-xs font-black text-[#0E3A8C]">Senha padrão gerada</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-white rounded-xl shadow-sm">
                                                <p className="text-xs font-black text-[#0E3A8C] tracking-wider">alunoelti</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all transition-transform active:scale-95"
                                            >
                                                Pular agora
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-[1.5] bg-[#0E3A8C] text-white font-black py-5 px-10 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-[#0a2b66]"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Finalizar Matrícula
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
