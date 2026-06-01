import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, BookOpen, GraduationCap, CheckCircle2, User, Search, Calendar, Clock, MapPin, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';

interface AddTurmaModalProps {
    isOpen: boolean;
    onClose: () => void;
    turma?: any; // If provided, edit mode
    fk_colegio: number | null;
    onSuccess: () => void;
}

const DAYS_OF_WEEK = [
    { id: 'Monday', label: 'Seg' },
    { id: 'Tuesday', label: 'Ter' },
    { id: 'Wednesday', label: 'Qua' },
    { id: 'Thursday', label: 'Qui' },
    { id: 'Friday', label: 'Sex' },
    { id: 'Saturday', label: 'Sáb' },
    { id: 'Sunday', label: 'Dom' }
];

export function AddTurmaModal({ isOpen, onClose, turma, fk_colegio, onSuccess }: AddTurmaModalProps) {
    const isEditMode = !!turma;
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form States
    const [nome, setNome] = useState('');
    const [fk_livro, setFkLivro] = useState<number | null>(null);
    const [professor_uuid, setProfessorUuid] = useState<string | null>(null);
    const [sala, setSala] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [horario_inicio, setHorarioInicio] = useState('');
    const [horario_fim, setHorarioFim] = useState('');
    const [data_inicio, setDataInicio] = useState('');
    const [data_fim, setDataFim] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Data States
    const [teachers, setTeachers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [salas, setSalas] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [fetchingData, setFetchingData] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (isEditMode) {
                setNome(turma.nome || '');
                setFkLivro(turma.fk_livro || null);
                setProfessorUuid(turma.professor_uuid || null);
                setSala(turma.sala || '');
                setSelectedDays(Array.isArray(turma.dias_semana) ? turma.dias_semana : []);
                setHorarioInicio(turma.horario_inicio || '');
                setHorarioFim(turma.horario_fim || '');
                setDataInicio(turma.data_inicio || '');
                setDataFim(turma.data_fim || '');
                setSelectedStudents(turma.alunos_uuids || []);
            } else {
                // Reset form
                setNome('');
                setFkLivro(null);
                setProfessorUuid(null);
                setSala('');
                setSelectedDays([]);
                setHorarioInicio('');
                setHorarioFim('');
                setDataInicio('');
                setDataFim('');
                setSelectedStudents([]);
            }
        }
    }, [isOpen, turma]);

    const fetchData = async () => {
        if (!fk_colegio) return;
        setFetchingData(true);
        try {
            // Fetch Teachers
            const { data: teacherData } = await supabase
                .from('users')
                .select('uuid, nome')
                .eq('fk_colegio', fk_colegio)
                .contains('tipousuario', ['Teacher'])
                .order('nome');

            setTeachers(teacherData || []);

            // Fetch Students
            const { data: studentData } = await supabase
                .from('users')
                .select('uuid, nome, tipousuario, email')
                .eq('fk_colegio', fk_colegio)
                .contains('tipousuario', ['Student'])
                .order('nome');

            setStudents(studentData || []);

            // Fetch Books
            const { data: booksData } = await supabase
                .from('books')
                .select('id, nome')
                .eq('status', true)
                .order('ordem');

            setBooks(booksData || []);

            // Fetch Salas
            const { data: salasData } = await supabase
                .from('salas')
                .select('id, nome')
                .eq('fk_colegio', fk_colegio)
                .order('nome');

            setSalas(salasData || []);
        } catch (error) {
            console.error('Error fetching modal data:', error);
        } finally {
            setFetchingData(false);
        }
    };

    const handleDayToggle = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        );
    };

    const handleStudentToggle = (uuid: string) => {
        setSelectedStudents(prev =>
            prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
        );
    };

    const handleSave = async () => {
        if (!fk_colegio) return;
        if (!nome || !fk_livro || !professor_uuid) {
            alert('Por favor, preencha os campos obrigatórios (Nome, Nível e Professor).');
            return;
        }

        setLoading(true);
        try {
            // Verificações de conflito de horário/sala
            // Só faz a verificação se houver dias e horários definidos
            if (selectedDays.length > 0 && horario_inicio && horario_fim) {
                // Busca outras turmas do mesmo colégio que estão ativas e têm o mesmo professor ou sala
                let query = supabase
                    .from('turmas')
                    .select('id, nome, professor_uuid, sala, dias_semana, horario_inicio, horario_fim, data_inicio, data_fim')
                    .eq('fk_colegio', fk_colegio)
                    .eq('ativo', true);

                if (sala) {
                    query = query.or(`professor_uuid.eq.${professor_uuid},sala.eq.${sala}`);
                } else {
                    query = query.eq('professor_uuid', professor_uuid);
                }

                const { data: turmasExistentes, error: turmasError } = await query;

                if (turmasError) throw turmasError;

                if (turmasExistentes && turmasExistentes.length > 0) {
                    const newInicio = data_inicio ? new Date(data_inicio) : null;
                    const newFim = data_fim ? new Date(data_fim) : null;

                    for (const t of turmasExistentes) {
                        // Ignora a própria turma se estivermos editando
                        if (isEditMode && turma && t.id === turma.id) continue;

                        // 1. Verifica sobreposição de datas
                        let dateOverlap = true;
                        if (newInicio && t.data_fim) {
                            const existingFim = new Date(t.data_fim);
                            if (newInicio > existingFim) dateOverlap = false;
                        }
                        if (newFim && t.data_inicio) {
                            const existingInicio = new Date(t.data_inicio);
                            if (newFim < existingInicio) dateOverlap = false;
                        }

                        if (!dateOverlap) continue;

                        // 2. Verifica sobreposição de dias da semana
                        const sharedDays = selectedDays.filter(day => (t.dias_semana || []).includes(day));
                        if (sharedDays.length === 0) continue;

                        // 3. Verifica sobreposição de horário
                        if (t.horario_inicio && t.horario_fim) {
                            if (t.horario_inicio < horario_fim && t.horario_fim > horario_inicio) {
                                // Conflito detectado!
                                if (t.professor_uuid === professor_uuid) {
                                    alert(`Conflito de Professor: O professor já possui a turma "${t.nome}" neste mesmo horário e período.`);
                                    setLoading(false);
                                    return;
                                }
                                if (sala && t.sala === sala) {
                                    alert(`Conflito de Sala: A sala "${sala}" já está sendo usada pela turma "${t.nome}" neste mesmo horário e período.`);
                                    setLoading(false);
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            const payload = {
                nome,
                fk_colegio,
                fk_livro,
                professor_uuid,
                sala,
                dias_semana: selectedDays,
                horario_inicio,
                horario_fim,
                data_inicio,
                data_fim,
                alunos_uuids: selectedStudents,
                ativo: true
            };

            let turmaId = turma?.id;

            if (isEditMode) {
                const { error } = await supabase
                    .from('turmas')
                    .update(payload)
                    .eq('id', turma.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('turmas')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                turmaId = data.id;
            }

            // Update users.fk_turma for selected students
            // First, remove this turma from any students who were in it but are no longer
            if (isEditMode) {
                await supabase
                    .from('users')
                    .update({ fk_turma: null })
                    .eq('fk_turma', turmaId);
            }

            // Then, set this turma for all currently selected students
            if (selectedStudents.length > 0) {
                const { error: userUpdateError } = await supabase
                    .from('users')
                    .update({ fk_turma: turmaId })
                    .in('uuid', selectedStudents);
                if (userUpdateError) throw userUpdateError;
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error saving turma:', error);
            alert('Erro ao salvar a turma.');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students
        .filter(s =>
            s.nome?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email?.toLowerCase().includes(studentSearch.toLowerCase())
        )
        .sort((a, b) => {
            const aSelected = selectedStudents.includes(a.uuid);
            const bSelected = selectedStudents.includes(b.uuid);

            // If selection status is different, selected comes first
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;

            // Otherwise, sort alphabetically by name
            return (a.nome || '').localeCompare(b.nome || '');
        });

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0E3A8C]/30 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white"
                    >
                        {/* Header */}
                        <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px] shrink-0">
                            <div
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                                    backgroundSize: '24px 24px'
                                }}
                            />
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                        {isEditMode ? 'Editar Turma' : 'Criar Nova Turma'}
                                    </h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Gestão de Turmas ELTI</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-white/10 rounded-2xl transition-all shadow-inner backdrop-blur-sm"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                            {/* General Information */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Informações Gerais</h4>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Nome da Turma</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Teens Advanced 01"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Nível (Livro)</label>
                                        <SearchableSelect
                                            options={books.map(b => ({ id: b.id, label: b.nome }))}
                                            value={fk_livro}
                                            onChange={setFkLivro}
                                            placeholder="Selecione o nível..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Professor Responsável</label>
                                        <SearchableSelect
                                            options={teachers.map(t => ({ id: t.uuid, label: t.nome }))}
                                            value={professor_uuid}
                                            onChange={setProfessorUuid}
                                            placeholder="Selecione um professor..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Schedule & Logistics */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                                    <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Agenda e Logística</h4>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Sala / Espaço Ocupado</label>
                                    <SearchableSelect
                                        options={salas.map(s => ({ id: s.nome, label: s.nome }))}
                                        value={sala}
                                        onChange={setSala}
                                        placeholder="Selecione uma sala..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Dias da Semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => handleDayToggle(day.id)}
                                                className={cn(
                                                    "px-6 py-3 rounded-xl text-xs font-black transition-all border-2",
                                                    selectedDays.includes(day.id)
                                                        ? "bg-[#0E3A8C] text-white border-[#0E3A8C] shadow-lg shadow-blue-900/20"
                                                        : "bg-white text-gray-400 border-transparent hover:border-gray-100 shadow-sm"
                                                )}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Horário de Início</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={horario_inicio}
                                                onChange={(e) => setHorarioInicio(e.target.value)}
                                                className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] transition-all text-sm appearance-none"
                                            />
                                            <Clock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Horário de Término</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={horario_fim}
                                                onChange={(e) => setHorarioFim(e.target.value)}
                                                className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] transition-all text-sm appearance-none"
                                            />
                                            <Clock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Data de Início</label>
                                        <input
                                            type="date"
                                            value={data_inicio}
                                            onChange={(e) => setDataInicio(e.target.value)}
                                            className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] transition-all text-sm appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Data de Término (Previsão)</label>
                                        <input
                                            type="date"
                                            value={data_fim}
                                            onChange={(e) => setDataFim(e.target.value)}
                                            className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] transition-all text-sm appearance-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Enroll Students */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                                        <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Matricular Alunos</h4>
                                    </div>
                                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">
                                        {selectedStudents.length} Selecionados
                                    </div>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-[#0E3A8C] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Buscar alunos..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] py-6 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm"
                                    />
                                </div>

                                <div className="bg-white rounded-[32px] border-2 border-transparent hover:border-gray-50 shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {fetchingData ? (
                                        <div className="p-10 flex flex-col items-center gap-2 text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="font-bold text-xs uppercase tracking-widest">Buscando alunos...</p>
                                        </div>
                                    ) : filteredStudents.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {filteredStudents.map(student => (
                                                <button
                                                    key={student.uuid}
                                                    type="button"
                                                    onClick={() => handleStudentToggle(student.uuid)}
                                                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                                                            selectedStudents.includes(student.uuid) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                                                        )}>
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-black text-[#0E3A8C] text-sm group-hover:translate-x-1 transition-transform">{student.nome}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold lowercase tracking-wider">{student.email || 'Sem email'}</div>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                                                        selectedStudents.includes(student.uuid)
                                                            ? "bg-green-500 border-green-500 text-white"
                                                            : "border-gray-100 bg-white group-hover:border-blue-100"
                                                    )}>
                                                        {selectedStudents.includes(student.uuid) && <Check className="w-5 h-5" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-gray-400">
                                            <p className="font-bold text-sm">Nenhum aluno encontrado</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-10 bg-white/50 backdrop-blur-md border-t border-gray-100 flex gap-4 shrink-0">
                            <button
                                onClick={onClose}
                                className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-white transition-all active:scale-95 shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || success}
                                className={cn(
                                    "flex-[1.5] py-5 px-10 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95",
                                    success
                                        ? "bg-green-500 text-white shadow-green-200"
                                        : "bg-[#0E3A8C] text-white hover:bg-[#072a6b] shadow-blue-900/30"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : success ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        {isEditMode ? 'Atualizado com Sucesso' : 'Criado com Sucesso'}
                                    </>
                                ) : (
                                    isEditMode ? 'Salvar Alterações' : 'Criar Turma'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
