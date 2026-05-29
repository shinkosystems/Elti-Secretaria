import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    DollarSign,
    User,
    Calendar,
    CreditCard,
    CheckCircle,
    Loader2,
    AlertCircle,
    ChevronDown,
    Search
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface NewPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    fk_colegio: number | null;
    onSuccess: () => void;
}

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto'];

export function NewPaymentModal({ isOpen, onClose, fk_colegio, onSuccess }: NewPaymentModalProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(`${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Pix');
    const [status, setStatus] = useState('Pago');

    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && fk_colegio) {
            fetchStudents();
        }
    }, [isOpen, fk_colegio]);

    const fetchStudents = async () => {
        setFetchingStudents(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('uuid, nome')
                .contains('tipousuario', ['Student'])
                .eq('fk_colegio', fk_colegio)
                .order('nome');

            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setFetchingStudents(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !amount || !month || !dueDate) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('mensalidades')
                .insert({
                    fk_usuario: selectedStudent,
                    fk_colegio: fk_colegio,
                    valor: parseFloat(amount),
                    mes_referencia: month,
                    data_vencimento: dueDate,
                    status: status,
                    metodo_pagamento: status === 'Pago' ? paymentMethod : null,
                    data_pagamento: status === 'Pago' ? new Date().toISOString() : null
                });

            if (insertError) throw insertError;

            setSuccess(true);
            onSuccess();
            setTimeout(() => {
                setSuccess(false);
                setSelectedStudent('');
                setAmount('');
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error('Payment registration error:', err);
            setError(err.message || 'Erro ao registrar pagamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
                        className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white"
                    >
                        {/* Header */}
                        <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px]">
                            <div
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                                    backgroundSize: '24px 24px'
                                }}
                            />
                            <button
                                onClick={onClose}
                                className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                    <DollarSign className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Novo Pagamento</h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Registro de Mensalidade</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRegister} className="p-10 space-y-6">
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-16 flex flex-col items-center text-center"
                                >
                                    <div className="w-24 h-24 rounded-[32px] bg-green-50 flex items-center justify-center mb-8 shadow-inner shadow-green-100/50">
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-[#0E3A8C] mb-3 leading-tight">Pagamento Registrado!</h4>
                                    <p className="text-gray-400 font-bold text-sm">O registro foi realizado com sucesso no sistema financeiro.</p>
                                </motion.div>
                            ) : (
                                <>
                                    {error && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-[24px] text-xs font-bold flex items-center gap-4 shadow-sm">
                                            <AlertCircle className="shrink-0 w-5 h-5" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Aluno</label>
                                            <div className="relative">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                                                <SearchableSelect
                                                    options={students.map(s => ({ id: s.uuid, label: s.nome }))}
                                                    value={selectedStudent}
                                                    onChange={setSelectedStudent}
                                                    placeholder="Selecione um aluno..."
                                                    searchPlaceholder="Buscar por nome do aluno..."
                                                    className="w-full"
                                                />
                                            </div>

                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Valor (R$)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        required
                                                        placeholder="0,00"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-4 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Mês Referência</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YYYY"
                                                        required
                                                        value={month}
                                                        onChange={(e) => setMonth(e.target.value)}
                                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-4 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Vencimento</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-4 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Status</label>
                                                <SearchableSelect
                                                    options={[
                                                        { id: 'Pago', label: 'Pago' },
                                                        { id: 'Pendente', label: 'Pendente' },
                                                        { id: 'Atrasado', label: 'Atrasado' }
                                                    ]}
                                                    value={status}
                                                    onChange={setStatus}
                                                    className="w-full"
                                                />

                                            </div>
                                        </div>

                                        {status === 'Pago' && (
                                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 text-green-600">Método de Pagamento</label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                                    <SearchableSelect
                                                        options={PAYMENT_METHODS.map(m => ({ id: m, label: m }))}
                                                        value={paymentMethod}
                                                        onChange={setPaymentMethod}
                                                        className="w-full"
                                                    />

                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[1.5] bg-[#0E3A8C] text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-[#0a2b66]"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Registro'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
