import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import {
    Users,
    User,
    GraduationCap,
    BookOpen,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Clock,
    MapPin,
    Loader2,
    Plus,
    ChevronRight,
    SearchIcon,
    History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { AddTurmaModal } from './AddTurmaModal';
import { TurmaHistoryModal } from './TurmaHistoryModal';

const DAY_MAP: { [key: string]: string } = {
    'Monday': 'Seg',
    'Tuesday': 'Ter',
    'Wednesday': 'Qua',
    'Thursday': 'Qui',
    'Friday': 'Sex',
    'Saturday': 'Sáb',
    'Sunday': 'Dom'
};

export function TurmasScreen() {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<number | 'Todos'>('Todos');
    const [turmas, setTurmas] = useState<any[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [professors, setProfessors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({
        total: 0,
        students: 0,
        teachers: 0
    });

    const [selectedTurma, setSelectedTurma] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useEffect(() => {
        if (profile?.fk_colegio) {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        if (!profile?.fk_colegio) return;

        setLoading(true);
        try {
            // Fetch Books (Levels)
            const { data: booksData } = await supabase
                .from('books')
                .select('id, nome')
                .eq('status', true)
                .order('ordem');

            setBooks(booksData || []);
            // Fetch Professors to resolve names locally
            const { data: profData } = await supabase
                .from('users')
                .select('id, uuid, nome')
                .contains('tipousuario', ['Teacher'])
                .eq('fk_colegio', profile.fk_colegio);

            setProfessors(profData || []);

            // Fetch Students to resolve names locally
            const { data: studentsData } = await supabase
                .from('users')
                .select('id, uuid, nome, tipousuario')
                .contains('tipousuario', ['Student'])
                .eq('fk_colegio', profile.fk_colegio);

            setStudents(studentsData || []);

            // First attempt with joins. If it fails due to missing FKs, we'll try a fallback.
            const { data, error } = await supabase
                .from('turmas')
                .select(`
                    *,
                    professor:users!professor_uuid(nome)
                `)
                .eq('fk_colegio', profile.fk_colegio)
                .order('nome');

            if (error) {
                console.warn('Join with professor failed or data error:', error);
                // Fallback: fetch without joins
                const { data: simpleData, error: simpleError } = await supabase
                    .from('turmas')
                    .select('*')
                    .eq('fk_colegio', profile.fk_colegio)
                    .order('nome');

                if (simpleError) throw simpleError;
                setTurmas(simpleData || []);

                // Calculate counts for simple data
                const totalTurmas = simpleData?.length || 0;
                const totalStudents = simpleData?.reduce((acc, t) => acc + (Array.isArray(t.alunos_uuids) ? t.alunos_uuids.length : 0), 0) || 0;
                const uniqueTeachers = new Set(simpleData?.map(t => t.professor_uuid).filter(Boolean)).size;

                setCounts({
                    total: totalTurmas,
                    students: totalStudents,
                    teachers: uniqueTeachers
                });
            } else {
                setTurmas(data || []);

                // Calculate counts
                const totalTurmas = data?.length || 0;
                const totalStudents = data?.reduce((acc, t) => acc + (Array.isArray(t.alunos_uuids) ? t.alunos_uuids.length : 0), 0) || 0;
                const uniqueTeachers = new Set(data?.map(t => t.professor_uuid).filter(Boolean)).size;

                setCounts({
                    total: totalTurmas,
                    students: totalStudents,
                    teachers: uniqueTeachers
                });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTurmas = turmas.filter(turma => {
        const query = searchQuery.toLowerCase();
        const profName = turma.professor?.nome || professors.find(p => p.uuid === turma.professor_uuid)?.nome || '';
        const matchesSearch =
            (turma.nome?.toLowerCase() || '').includes(query) ||
            (profName.toLowerCase()).includes(query) ||
            (Array.isArray(turma.alunos_uuids) && turma.alunos_uuids.some((uuid: string) => {
                const s = students.find(std => std.uuid === uuid);
                return s?.nome?.toLowerCase().includes(query);
            }));

        const matchesLevel = levelFilter === 'Todos' || turma.fk_livro === levelFilter;

        return matchesSearch && matchesLevel;
    });

    const getLevelLabel = (id: number) => books.find(b => b.id === id)?.nome || '—';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6 pb-20">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={BookOpen}
                    label="Total de Turmas"
                    value={counts.total}
                    color="text-purple-500"
                    bgColor="bg-purple-50"
                />
                <StatCard
                    icon={Users}
                    label="Alunos Matriculados"
                    value={counts.students}
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Professores Ativos"
                    value={counts.teachers}
                    color="text-green-500"
                    bgColor="bg-green-50"
                />
            </div>

            {/* List Card - Matches UsersScreen design */}
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
                <div className="p-8 space-y-8 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-[#0E3A8C] flex items-center gap-3">
                            Gestão de Turmas
                        </h3>
                        <button
                            onClick={() => {
                                setSelectedTurma(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-brand-red text-white font-black py-4 px-8 rounded-full shadow-lg shadow-brand-red/20 flex items-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" />
                            Nova Turma
                        </button>
                    </div>

                    <div className="w-full">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por turma, professor ou aluno..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none w-full transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar max-w-full">
                        <button
                            onClick={() => setLevelFilter('Todos')}
                            className={cn(
                                "whitespace-nowrap px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                                levelFilter === 'Todos'
                                    ? "bg-[#0E3A8C] text-white shadow-xl shadow-blue-900/20"
                                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                            )}
                        >
                            Todos
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[8px] font-black",
                                levelFilter === 'Todos' ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                            )}>
                                {turmas.length}
                            </span>
                        </button>
                        {books.map(book => {
                            const count = turmas.filter(t => t.fk_livro === book.id).length;
                            return (
                                <button
                                    key={book.id}
                                    onClick={() => setLevelFilter(book.id)}
                                    className={cn(
                                        "whitespace-nowrap px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                                        levelFilter === book.id
                                            ? "bg-[#0E3A8C] text-white shadow-xl shadow-blue-900/20"
                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    {book.nome}
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-full text-[8px] font-black",
                                        levelFilter === book.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p className="font-bold">Carregando turmas...</p>
                        </div>
                    ) : filteredTurmas.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Turma</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Professor</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário / Dias</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTurmas.map((turma) => (
                                    <tr key={turma.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#0E3A8C] font-black shadow-sm overflow-hidden text-sm uppercase">
                                                    {turma.nome?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-[#0E3A8C] text-sm">{turma.nome}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sala: {turma.sala || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                {getLevelLabel(turma.fk_livro)}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <span className="text-gray-600 font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                    {turma.professor?.nome || professors.find(p => p.uuid === turma.professor_uuid)?.nome || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-gray-700 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                    <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                                    {turma.horario_inicio?.slice(0, 5)} - {turma.horario_fim?.slice(0, 5)}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                    <Calendar className="w-3 h-3 text-gray-300 shrink-0" />
                                                    {Array.isArray(turma.dias_semana)
                                                        ? turma.dias_semana.map((d: string) => DAY_MAP[d] || d).join(', ')
                                                        : turma.dias_semana || '—'
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {Array.isArray(turma.alunos_uuids) && turma.alunos_uuids.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-sm font-black text-[#0E3A8C]">
                                                        {turma.alunos_uuids.length}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 italic">0</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTurma(turma);
                                                        setIsHistoryModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-[#0E3A8C]/5 rounded-xl transition-all text-[#0E3A8C] flex items-center gap-2 font-black text-[10px] uppercase tracking-wider mx-1"
                                                    title="Histórico"
                                                >
                                                    <History className="w-4 h-4" />
                                                    Hist.
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTurma(turma);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-[#0E3A8C]/5 rounded-xl transition-all text-[#0E3A8C] flex items-center gap-2 font-black text-[10px] uppercase tracking-wider"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                    Configurar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-300">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-black text-xl">Nenhuma turma encontrada</p>
                            <p className="font-bold text-sm">Tente ajustar seus filtros ou busca.</p>
                        </div>
                    )}
                </div>
            </div>

            <AddTurmaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                turma={selectedTurma}
                fk_colegio={profile?.fk_colegio}
                onSuccess={fetchData}
            />

            <TurmaHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                turma={selectedTurma}
                fk_colegio={profile?.fk_colegio}
            />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-white/50 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", bgColor)}>
                <Icon className={cn("w-8 h-8", color)} />
            </div>
            <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</div>
                <div className="text-3xl font-black text-[#0E3A8C] tracking-tighter">{value}</div>
            </div>
        </div>
    );
}
