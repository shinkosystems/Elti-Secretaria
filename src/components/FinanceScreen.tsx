import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    Filter,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    ChevronRight,
    TrendingUp,
    CreditCard,
    Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { StudentFinanceModal } from './StudentFinanceModal';

interface FinanceScreenProps {
    onOpenPaymentModal: () => void;
}

export function FinanceScreen({ onOpenPaymentModal }: FinanceScreenProps) {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('Todos');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

    useEffect(() => {
        if (profile?.fk_colegio) {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        if (!profile?.fk_colegio) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    uuid,
                    nome,
                    email,
                    foto,
                    tipousuario,
                    turmas:fk_turma (id, nome),
                    mensalidades (
                        id,
                        status,
                        mes_referencia
                    )
                `)
                .contains('tipousuario', ['Student'])
                .eq('fk_colegio', profile.fk_colegio)
                .order('nome');

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = (s.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const currentMensalidade = s.mensalidades?.find((m: any) => m.mes_referencia === currentMonth);
        const status = currentMensalidade?.status || 'Pendente';

        if (filter === 'Todos') return matchesSearch;
        return matchesSearch && status === filter;
    });

    const stats = {
        total: students.length,
        pago: students.filter(s => s.mensalidades?.find((m: any) => m.mes_referencia === currentMonth && m.status === 'Pago')).length,
        pendente: students.filter(s => {
            const m = s.mensalidades?.find((m: any) => m.mes_referencia === currentMonth);
            return !m || m.status === 'Pendente';
        }).length,
        atrasado: students.filter(s => s.mensalidades?.find((m: any) => m.mes_referencia === currentMonth && m.status === 'Atrasado')).length
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Total Alunos"
                    value={stats.total}
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Mensalidades Pagas"
                    value={stats.pago}
                    color="text-green-500"
                    bgColor="bg-green-50"
                />
                <StatCard
                    icon={Clock}
                    label="Pendentes"
                    value={stats.pendente}
                    color="text-yellow-500"
                    bgColor="bg-yellow-50"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Em Atraso"
                    value={stats.atrasado}
                    color="text-red-500"
                    bgColor="bg-red-50"
                />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black text-[#0E3A8C] flex items-center gap-3">
                            Controle de Mensalidades
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                                {currentMonth}
                            </span>
                        </h3>
                        <p className="text-gray-400 font-bold text-xs mt-1">Acompanhe a situação financeira de cada aluno em tempo real.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={onOpenPaymentModal}
                            className="bg-[#0E3A8C] text-white px-6 py-3 rounded-2xl hover:bg-[#0a2b66] transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-3 group"
                        >
                            <DollarSign className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Inserir Pagamento</span>
                        </button>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-[#0E3A8C]" />
                            <input
                                type="text"
                                placeholder="Buscar aluno..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 rounded-2xl py-3 pl-10 pr-6 text-sm font-bold text-gray-700 outline-none w-full lg:w-64 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {['Todos', 'Pago', 'Pendente', 'Atrasado'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filter === f
                                            ? "bg-[#0E3A8C] text-white shadow-lg shadow-blue-900/20"
                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="w-12 h-12 animate-spin mb-6 text-[#0E3A8C] opacity-20" />
                            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Carregando Painel...</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Aluno</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Turma</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Mensalidade</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.map((student) => {
                                    const m = student.mensalidades?.find((m: any) => m.mes_referencia === currentMonth);
                                    const status = m?.status || 'Pendente';

                                    return (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-50/30 transition-all cursor-pointer group"
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#0E3A8C] font-black shadow-sm overflow-hidden text-sm relative group-hover:scale-110 transition-transform">
                                                        {student.foto ? (
                                                            <img src={student.foto} alt={student.nome} className="w-full h-full object-cover" />
                                                        ) : (
                                                            student.nome.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#0E3A8C] text-sm tracking-tight">{student.nome}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-[#0E3A8C] uppercase tracking-widest">{student.turmas?.nome || '—'}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 italic">Escola ELTI</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={cn(
                                                    "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm",
                                                    status === 'Pago' ? "bg-green-50 text-green-600" :
                                                        status === 'Atrasado' ? "bg-red-50 text-red-600" :
                                                            "bg-yellow-50 text-yellow-600"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full",
                                                        status === 'Pago' ? "bg-green-500" :
                                                            status === 'Atrasado' ? "bg-red-500 animate-pulse" :
                                                                "bg-yellow-500"
                                                    )} />
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button className="p-3 bg-gray-50 text-gray-300 rounded-2xl group-hover:bg-[#0E3A8C] group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-gray-300">
                            <Info className="w-16 h-16 mb-6 opacity-20" />
                            <p className="font-black text-xl">Nenhum aluno encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            <StudentFinanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedStudent}
                fk_colegio={profile?.fk_colegio}
                onSuccess={fetchData}
            />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-white/50 flex flex-col gap-4 group hover:scale-[1.02] transition-all duration-500">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", bgColor)}>
                <Icon className={cn("w-6 h-6", color)} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-[#0E3A8C] tracking-tighter">{value}</p>
            </div>
        </div>
    );
}
