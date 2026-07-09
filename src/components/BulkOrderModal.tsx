// @sos-edit: false
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Package, User, MapPin, School, Home, CheckCircle2, Users, Search, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';

interface Student {
    id: number;
    uuid: string;
    nome: string;
    email: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
}

interface SchoolInfo {
    nome: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

interface Turma {
    id: number;
    nome: string;
    alunos_uuids: string[] | null;
}

interface BulkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    materials: any[];
}

export function BulkOrderModal({ isOpen, onClose, onSuccess, materials }: BulkOrderModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [success, setSuccess] = useState(false);

    const [books, setBooks] = useState<any[]>([]);
    
    // Form States
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedStudentUuids, setSelectedStudentUuids] = useState<string[]>([]);
    const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
    const [addressType, setAddressType] = useState<'school' | 'home'>('school');
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && profile?.fk_colegio) {
            fetchInitialData();
        }
    }, [isOpen, profile]);

    const fetchInitialData = async () => {
        setFetchingData(true);
        try {
            // Fetch Books
            const { data: booksData } = await supabase
                .from('books')
                .select('*')
                .order('nome');
            setBooks(booksData || []);

            // Fetch Students
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .eq('fk_colegio', profile?.fk_colegio)
                .order('nome');
            
            const studentsData = (usersData || []).filter(u => {
                if (!u.tipousuario) return false;
                const roles = Array.isArray(u.tipousuario) ? u.tipousuario : [u.tipousuario];
                return roles.includes('Student');
            });
            
            setStudents(studentsData);

            // Fetch Turmas
            const { data: turmasData } = await supabase
                .from('turmas')
                .select('id, nome, alunos_uuids')
                .eq('fk_colegio', profile?.fk_colegio)
                .order('nome');
            setTurmas(turmasData || []);

            // Fetch School Info
            const { data: schoolData } = await supabase
                .from('colegios')
                .select('*')
                .eq('id', profile?.fk_colegio)
                .single();
            setSchoolInfo(schoolData);

        } catch (error) {
            console.error('Error fetching initial data for bulk order:', error);
        } finally {
            setFetchingData(false);
        }
    };

    const handleTurmaChange = (turmaIdStr: string | null) => {
        setSelectedTurmaId(turmaIdStr);
        if (!turmaIdStr) {
            setSelectedStudentUuids([]);
            return;
        }

        const numericTurmaId = parseInt(turmaIdStr);
        const turma = turmas.find(t => t.id === numericTurmaId);
        if (turma && turma.alunos_uuids) {
            // Filter student UUIDs to only those belonging to students existing in the current list
            const validStudentUuids = students
                .filter(s => turma.alunos_uuids?.includes(s.uuid))
                .map(s => s.uuid);
            setSelectedStudentUuids(validStudentUuids);
        } else {
            setSelectedStudentUuids([]);
        }
    };

    const toggleStudentSelection = (uuid: string) => {
        setSelectedStudentUuids(prev => {
            if (prev.includes(uuid)) {
                return prev.filter(id => id !== uuid);
            } else {
                return [...prev, uuid];
            }
        });
    };

    const selectAllStudents = () => {
        if (selectedTurmaId) {
            const numericTurmaId = parseInt(selectedTurmaId);
            const turma = turmas.find(t => t.id === numericTurmaId);
            if (turma && turma.alunos_uuids) {
                const validStudentUuids = students
                    .filter(s => turma.alunos_uuids?.includes(s.uuid))
                    .map(s => s.uuid);
                setSelectedStudentUuids(validStudentUuids);
            }
        } else {
            setSelectedStudentUuids(students.map(s => s.uuid));
        }
    };

    const deselectAllStudents = () => {
        setSelectedStudentUuids([]);
    };

    const getSelectedStudentsWithMissingAddress = () => {
        if (addressType !== 'home') return [];
        return students.filter(s => selectedStudentUuids.includes(s.uuid) && !s.logradouro);
    };

    const missingAddressStudents = getSelectedStudentsWithMissingAddress();
    const hasMissingAddressError = addressType === 'home' && missingAddressStudents.length > 0;

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.nome.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                              s.email.toLowerCase().includes(studentSearchQuery.toLowerCase());
        
        if (selectedTurmaId) {
            const numericTurmaId = parseInt(selectedTurmaId);
            const turma = turmas.find(t => t.id === numericTurmaId);
            if (turma && turma.alunos_uuids) {
                return matchesSearch && turma.alunos_uuids.includes(s.uuid);
            }
            return false;
        }
        
        return matchesSearch;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || selectedStudentUuids.length === 0 || !profile) return;

        setLoading(true);
        try {
            const isBook = selectedItemId.startsWith('b_');
            const numericId = parseInt(selectedItemId.replace(/^(m_|b_)/, ''));
            
            let itemName = 'Material';
            if (isBook) {
                const book = books.find(b => b.id === numericId);
                if (book) itemName = book.nome;
            } else {
                const material = materials.find(m => m.id === numericId);
                if (material) itemName = material.nome;
            }

            // Generate delivery address for each student
            const ordersToInsert = selectedStudentUuids.map(studentUuid => {
                const student = students.find(s => s.uuid === studentUuid);
                let deliveryAddress = '';

                if (addressType === 'school' && schoolInfo) {
                    deliveryAddress = `Escola: ${schoolInfo.rua}, ${schoolInfo.numero} - ${schoolInfo.bairro}, ${schoolInfo.cidade}/${schoolInfo.estado} (CEP: ${schoolInfo.cep})`;
                } else if (addressType === 'home' && student) {
                    deliveryAddress = `Residencial: ${student.logradouro || 'N/A'}, ${student.numero || 'N/A'} - ${student.bairro || 'N/A'}, ${student.cidade || 'N/A'}/${student.uf || 'N/A'} (CEP: ${student.cep || 'N/A'})`;
                }

                return {
                    fk_colegio: profile.fk_colegio,
                    fk_usuario: studentUuid,
                    fk_material: isBook ? null : numericId,
                    item_nome: itemName,
                    status: 'Pedido Feito',
                    endereco_entrega: deliveryAddress
                };
            });

            const { error } = await supabase
                .from('pedidos_materiais')
                .insert(ordersToInsert);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess();
                onClose();
                resetForm();
            }, 2000);
        } catch (error) {
            console.error('Error creating bulk orders:', error);
            alert('Erro ao criar pedidos em lote. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedItemId(null);
        setSelectedStudentUuids([]);
        setSelectedTurmaId(null);
        setAddressType('school');
        setStudentSearchQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl border border-white my-8 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px] shrink-0">
                            <div
                                className="absolute inset-0 opacity-10"
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
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Pedido em Lote</h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                </div>
                            </div>
                        </div>

                        {fetchingData ? (
                            <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                                <Loader2 className="w-12 h-12 animate-spin mb-6 text-[#0E3A8C] opacity-20" />
                                <p className="font-black text-[10px] uppercase tracking-[0.3em]">Carregando alunos e turmas...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 min-h-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left side: Setup */}
                                    <div className="space-y-6">
                                        {/* Material Selection */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                                <Package className="w-3 h-3" />
                                                Material Didático
                                            </label>
                                            <SearchableSelect
                                                options={[
                                                    ...materials.map(m => ({ id: `m_${m.id}`, label: m.nome, type: 'Material' })),
                                                    ...books.map(b => ({ id: `b_${b.id}`, label: b.nome, description: b.nivel, type: 'Livro' }))
                                                ]}
                                                value={selectedItemId || ''}
                                                onChange={(id) => setSelectedItemId(id || null)}
                                                placeholder="Selecione o material..."
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Select by Class (Turma) */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                                <Users className="w-3 h-3" />
                                                Selecionar por Turma (Atalho)
                                            </label>
                                            <SearchableSelect
                                                options={turmas.map(t => ({
                                                    id: t.id.toString(),
                                                    label: t.nome,
                                                    description: `${t.alunos_uuids?.length || 0} alunos`
                                                }))}
                                                value={selectedTurmaId || ''}
                                                onChange={(val) => handleTurmaChange(val)}
                                                placeholder="Selecione uma turma para marcar todos os alunos..."
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Address Selection */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                Local de Entrega (Para todos do lote)
                                            </label>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddressType('school')}
                                                    className={cn(
                                                        "p-4 rounded-[20px] border-2 transition-all flex flex-col gap-2 group relative overflow-hidden",
                                                        addressType === 'school'
                                                            ? "border-[#0E3A8C] bg-blue-50/30 shadow-lg shadow-blue-900/5"
                                                            : "border-gray-50 bg-gray-50/30 hover:border-gray-100"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            addressType === 'school' ? "bg-[#0E3A8C] text-white" : "bg-gray-100 text-gray-400"
                                                        )}>
                                                            <School className="w-4 h-4" />
                                                        </div>
                                                        {addressType === 'school' && <div className="w-4 h-4 rounded-full bg-[#0E3A8C] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={cn(
                                                            "block font-black text-[10px] uppercase tracking-wider",
                                                            addressType === 'school' ? "text-[#0E3A8C]" : "text-gray-400"
                                                        )}>Retirar na Escola</span>
                                                        <span className="text-[9px] text-gray-400 font-bold line-clamp-1 mt-0.5">
                                                            {schoolInfo ? `${schoolInfo.rua}, ${schoolInfo.numero}` : 'Endereço da Unidade'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setAddressType('home')}
                                                    className={cn(
                                                        "p-4 rounded-[20px] border-2 transition-all flex flex-col gap-2 group relative overflow-hidden",
                                                        addressType === 'home'
                                                            ? "border-[#0E3A8C] bg-blue-50/30 shadow-lg shadow-blue-900/5"
                                                            : "border-gray-50 bg-gray-50/30 hover:border-gray-100"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            addressType === 'home' ? "bg-[#0E3A8C] text-white" : "bg-gray-100 text-gray-400"
                                                        )}>
                                                            <Home className="w-4 h-4" />
                                                        </div>
                                                        {addressType === 'home' && <div className="w-4 h-4 rounded-full bg-[#0E3A8C] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={cn(
                                                            "block font-black text-[10px] uppercase tracking-wider",
                                                            addressType === 'home' ? "text-[#0E3A8C]" : "text-gray-400"
                                                        )}>Entrega em Casa</span>
                                                        <span className="text-[9px] text-gray-400 font-bold line-clamp-1 mt-0.5">
                                                            Endereço Residencial dos Alunos
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Address validation warnings */}
                                        {hasMissingAddressError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2 text-red-600 max-h-[150px] overflow-y-auto"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <X className="w-4 h-4 shrink-0" />
                                                    <p className="text-[10px] font-black uppercase tracking-wider">Atenção: Alunos sem endereço residencial!</p>
                                                </div>
                                                <ul className="list-disc pl-5 text-[9px] font-bold space-y-0.5">
                                                    {missingAddressStudents.map(s => (
                                                        <li key={s.uuid}>{s.nome} ({s.email})</li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Right side: Student Selection List */}
                                    <div className="border border-gray-100 rounded-[32px] p-6 bg-gray-50/50 flex flex-col h-[400px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Alunos ({selectedStudentUuids.length} selecionados)
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={selectAllStudents}
                                                    className="text-[9px] font-black text-[#0E3A8C] uppercase tracking-widest hover:underline"
                                                >
                                                    Todos
                                                </button>
                                                <span className="text-[9px] text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={deselectAllStudents}
                                                    className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:underline"
                                                >
                                                    Nenhum
                                                </button>
                                            </div>
                                        </div>

                                        {/* Student Search */}
                                        <div className="relative mb-4 shrink-0">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar aluno por nome ou email..."
                                                value={studentSearchQuery}
                                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 font-bold text-xs focus:outline-none focus:border-[#0E3A8C]/20 transition-all text-[#0E3A8C]"
                                            />
                                        </div>

                                        {/* Students Checklist Container */}
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {filteredStudents.length > 0 ? (
                                                filteredStudents.map(student => {
                                                    const isSelected = selectedStudentUuids.includes(student.uuid);
                                                    const isMissingAddress = addressType === 'home' && !student.logradouro;

                                                    return (
                                                        <button
                                                            key={student.uuid}
                                                            type="button"
                                                            onClick={() => toggleStudentSelection(student.uuid)}
                                                            className={cn(
                                                                "w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all",
                                                                isSelected 
                                                                    ? "border-blue-100 bg-blue-50/20" 
                                                                    : "border-transparent bg-white hover:bg-gray-100/50",
                                                                isMissingAddress && isSelected && "border-red-100 bg-red-50/10"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 truncate min-w-0">
                                                                {isSelected ? (
                                                                    <CheckSquare className="w-5 h-5 text-[#0E3A8C] shrink-0" />
                                                                ) : (
                                                                    <Square className="w-5 h-5 text-gray-300 shrink-0" />
                                                                )}
                                                                <div className="truncate">
                                                                    <span className={cn(
                                                                        "block font-bold text-xs truncate",
                                                                        isSelected ? "text-[#0E3A8C]" : "text-gray-600"
                                                                    )}>
                                                                        {student.nome}
                                                                    </span>
                                                                    <span className="block text-[9px] text-gray-400 font-bold truncate">
                                                                        {student.email}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Label if address is missing */}
                                                            {isMissingAddress && (
                                                                <span className="text-[8px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded uppercase shrink-0">
                                                                    Sem Endereço
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                                                    <User className="w-8 h-8 mb-2 opacity-20" />
                                                    <p className="font-bold text-xs">Nenhum aluno encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer buttons */}
                                <div className="flex gap-4 pt-6 border-t border-gray-100 shrink-0">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedItemId || selectedStudentUuids.length === 0 || hasMissingAddressError}
                                        className={cn(
                                            "flex-[1.5] py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed",
                                            success ? "bg-green-500 text-white shadow-green-200" : "bg-brand-red text-white shadow-brand-red/20"
                                        )}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : success ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Pedidos Realizados ({selectedStudentUuids.length})!
                                            </>
                                        ) : (
                                            `Confirmar ${selectedStudentUuids.length} Pedidos`
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
