import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, DollarSign, CheckCircle2, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Mensalidade {
    id: number;
    mes_referencia: string;
    valor: number;
    status: string;
    data_vencimento: string;
    data_pagamento: string | null;
}

interface StudentFinanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: number;
        uuid: string;
        nome: string;
        foto: string | null;
    } | null;
    fk_colegio: number | null;
    onSuccess: () => void;
}

export function StudentFinanceModal({ isOpen, onClose, user, fk_colegio, onSuccess }: StudentFinanceModalProps) {
    const [history, setHistory] = useState<Mensalidade[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && user?.uuid) {
            fetchHistory();
        }
    }, [isOpen, user]);

    const fetchHistory = async () => {
        if (!user?.uuid) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mensalidades')
                .select('*')
                .eq('fk_usuario', user.uuid)
                .order('data_vencimento', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching finance history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (id: number) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('mensalidades')
                .update({
                    status: 'Pago',
                    data_pagamento: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            fetchHistory();
            onSuccess();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pago': return "bg-green-50 text-green-600 border border-green-100";
            case 'Atrasado': return "bg-red-50 text-red-600 border border-red-100";
            default: return "bg-yellow-50 text-yellow-600 border border-yellow-100";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white"
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

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm border border-white/20 overflow-hidden">
                                        {user?.foto ? (
                                            <img src={user.foto} alt={user.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-none mb-2">{user?.nome}</h3>
                                        <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Histórico Financeiro</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-white/10 rounded-2xl transition-all shadow-inner backdrop-blur-sm"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                    <p className="font-bold">Carregando histórico...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {history.map((m) => (
                                        <div key={m.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#0E3A8C]">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#0E3A8C] text-sm uppercase">{m.mes_referencia}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vencimento: {new Date(m.data_vencimento).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-black text-[#0E3A8C] text-lg tracking-tighter">R$ {m.valor.toFixed(2)}</p>
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                                                        getStatusStyles(m.status)
                                                    )}>
                                                        {m.status === 'Pago' ? <CheckCircle2 className="w-3 h-3" /> :
                                                            m.status === 'Atrasado' ? <AlertCircle className="w-3 h-3" /> :
                                                                <Clock className="w-3 h-3" />}
                                                        {m.status}
                                                    </span>
                                                </div>

                                                {m.status !== 'Pago' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(m.id)}
                                                        disabled={updatingId === m.id}
                                                        className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                                        title="Marcar como Pago"
                                                    >
                                                        {updatingId === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                                    <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-black text-xl">Nenhum registro encontrado</p>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="py-4 px-10 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Fechar Janela
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
