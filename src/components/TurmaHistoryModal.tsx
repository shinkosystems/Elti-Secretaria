import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    History,
    Calendar,
    Clock,
    User,
    MapPin,
    AlertCircle,
    Loader2,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const DAY_MAP: { [key: string]: string } = {
    'Monday': 'Segunda',
    'Tuesday': 'Terça',
    'Wednesday': 'Quarta',
    'Thursday': 'Quinta',
    'Friday': 'Sexta',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
};

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function TurmaHistoryModal({ isOpen, onClose, turma, fk_colegio }: any) {
    const { profile } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [tipoAlteracao, setTipoAlteracao] = useState('Professor');
    const [novoProfessor, setNovoProfessor] = useState('');
    const [novaSala, setNovaSala] = useState('');
    const [novoInicio, setNovoInicio] = useState('');
    const [novoFim, setNovoFim] = useState('');
    const [novosDias, setNovosDias] = useState<string[]>([]);
    const [dataVigencia, setDataVigencia] = useState('');

    // Auxiliary data
    const [professors, setProfessors] = useState<any[]>([]);
    const [salas, setSalas] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && turma?.id) {
            fetchData();
        }
    }, [isOpen, turma]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch History
            const { data: histData } = await supabase
                .from('turmas_historico')
                .select(`
                    *,
                    users!changed_by(nome)
                `)
                .eq('fk_turma', turma.id)
                .order('created_at', { ascending: false });
            
            if (histData) setHistory(histData);

            // Fetch Professors
            const { data: profData } = await supabase
                .from('users')
                .select('uuid, nome')
                .contains('tipousuario', ['Teacher'])
                .eq('fk_colegio', fk_colegio);
            if (profData) setProfessors(profData);

            // Fetch Salas
            const { data: salasData } = await supabase
                .from('salas')
                .select('nome')
                .eq('fk_colegio', fk_colegio)
                .order('nome');
            if (salasData) setSalas(salasData);

            // Pre-fill fields with current turma values
            if (turma.professor_uuid) setNovoProfessor(turma.professor_uuid);
            if (turma.sala) setNovaSala(turma.sala);
            if (turma.horario_inicio) setNovoInicio(turma.horario_inicio.slice(0, 5));
            if (turma.horario_fim) setNovoFim(turma.horario_fim.slice(0, 5));
            if (turma.dias_semana) setNovosDias(Array.isArray(turma.dias_semana) ? turma.dias_semana : []);

        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateConflict = async () => {
        // Build the simulated "future" class based on current inputs
        let checkProfessor = turma.professor_uuid;
        let checkSala = turma.sala;
        let checkInicio = turma.horario_inicio;
        let checkFim = turma.horario_fim;
        let checkDias = Array.isArray(turma.dias_semana) ? turma.dias_semana : [];

        if (tipoAlteracao === 'Professor') checkProfessor = novoProfessor;
        if (tipoAlteracao === 'Sala') checkSala = novaSala;
        if (tipoAlteracao === 'Horário') {
            checkInicio = novoInicio;
            checkFim = novoFim;
        }
        if (tipoAlteracao === 'Dias') checkDias = novosDias;

        if (!checkDias.length || !checkInicio || !checkFim) return true; // nothing to overlap

        let query = supabase
            .from('turmas')
            .select('id, nome, professor_uuid, sala, dias_semana, horario_inicio, horario_fim, data_inicio, data_fim')
            .eq('fk_colegio', fk_colegio)
            .eq('ativo', true);

        if (checkSala) {
            query = query.or(`professor_uuid.eq.${checkProfessor},sala.eq.${checkSala}`);
        } else {
            query = query.eq('professor_uuid', checkProfessor);
        }

        const { data: turmasExistentes } = await query;
        if (!turmasExistentes || turmasExistentes.length === 0) return true;

        const newInicioVigencia = new Date(dataVigencia);
        const newFimTurma = turma.data_fim ? new Date(turma.data_fim) : null;

        for (const t of turmasExistentes) {
            if (t.id === turma.id) continue;

            // Date overlap logic
            let dateOverlap = true;
            if (t.data_fim) {
                const existingFim = new Date(t.data_fim);
                if (newInicioVigencia > existingFim) dateOverlap = false;
            }
            if (newFimTurma && t.data_inicio) {
                const existingInicio = new Date(t.data_inicio);
                if (newFimTurma < existingInicio) dateOverlap = false;
            }

            if (!dateOverlap) continue;

            // Day overlap
            const sharedDays = checkDias.filter(day => (t.dias_semana || []).includes(day));
            if (sharedDays.length === 0) continue;

            // Time overlap
            if (t.horario_inicio && t.horario_fim) {
                if (t.horario_inicio < checkFim && t.horario_fim > checkInicio) {
                    if (t.professor_uuid === checkProfessor) {
                        alert(`Conflito: O professor já possui a turma "${t.nome}" neste mesmo horário a partir desta data.`);
                        return false;
                    }
                    if (checkSala && t.sala === checkSala) {
                        alert(`Conflito: A sala "${checkSala}" já está sendo usada pela turma "${t.nome}" neste mesmo horário.`);
                        return false;
                    }
                }
            }
        }

        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!dataVigencia) {
            alert('A Data de Início é obrigatória.');
            return;
        }

        setIsSaving(true);
        try {
            const isValid = await validateConflict();
            if (!isValid) {
                setIsSaving(false);
                return;
            }

            let valorAntigo: any = {};
            let valorNovo: any = {};

            if (tipoAlteracao === 'Professor') {
                const profObj = professors.find(p => p.uuid === novoProfessor);
                const profAntigoObj = professors.find(p => p.uuid === turma.professor_uuid);
                valorAntigo = { uuid: turma.professor_uuid, nome: profAntigoObj?.nome || 'Não definido' };
                valorNovo = { uuid: novoProfessor, nome: profObj?.nome || '' };
            } else if (tipoAlteracao === 'Sala') {
                valorAntigo = { sala: turma.sala || 'Não definida' };
                valorNovo = { sala: novaSala };
            } else if (tipoAlteracao === 'Horário') {
                valorAntigo = { inicio: turma.horario_inicio, fim: turma.horario_fim };
                valorNovo = { inicio: novoInicio, fim: novoFim };
            } else if (tipoAlteracao === 'Dias') {
                valorAntigo = Array.isArray(turma.dias_semana) ? turma.dias_semana : [];
                valorNovo = novosDias;
            }

            const { error } = await supabase
                .from('turmas_historico')
                .insert([{
                    fk_turma: turma.id,
                    changed_by: profile?.id,
                    tipo_alteracao: tipoAlteracao,
                    valor_antigo: valorAntigo,
                    valor_novo: valorNovo,
                    data_inicio_vigencia: dataVigencia
                }]);

            if (error) throw error;
            
            // Refresh
            fetchData();
            alert('Alteração agendada com sucesso!');
        } catch (error) {
            console.error('Error saving history:', error);
            alert('Erro ao agendar alteração.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatHistoryValue = (tipo: string, val: any) => {
        if (!val) return '—';
        if (tipo === 'Professor') return val.nome;
        if (tipo === 'Sala') return val.sala;
        if (tipo === 'Horário') return `${val.inicio?.slice(0,5) || ''} as ${val.fim?.slice(0,5) || ''}`;
        if (tipo === 'Dias') return Array.isArray(val) ? val.map(d => DAY_MAP[d] || d).join(', ') : '—';
        return JSON.stringify(val);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 bg-[#0E3A8C] text-white shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors z-[60] cursor-pointer"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <div className="flex items-center gap-5 relative z-10 pointer-events-none">
                                <div className="w-14 h-14 rounded-[20px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                    <History className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight leading-none mb-1">Histórico da Turma</h3>
                                    <p className="text-blue-100/60 font-bold text-sm">{turma?.nome}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50/30">
                            
                            {/* Left Col: Timeline */}
                            <div className="space-y-6">
                                <h4 className="font-black text-[#0E3A8C] uppercase tracking-widest text-xs flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Linha do Tempo
                                </h4>
                                
                                {loading ? (
                                    <div className="py-10 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-400">Nenhuma alteração registrada.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
                                        {history.map((h: any, i: number) => (
                                            <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                {/* Icon */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                    {h.aplicado ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
                                                </div>
                                                
                                                {/* Card */}
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-lg border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0E3A8C]">
                                                            {h.tipo_alteracao}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-400">
                                                            {new Date(h.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-1 mb-3">
                                                        <div className="text-xs font-bold text-gray-400 flex items-center gap-1 line-through opacity-70">
                                                            {formatHistoryValue(h.tipo_alteracao, h.valor_antigo)}
                                                        </div>
                                                        <div className="text-xs font-black text-gray-700 flex items-center gap-1">
                                                            <ArrowRight className="w-3 h-3 text-blue-500" />
                                                            {formatHistoryValue(h.tipo_alteracao, h.valor_novo)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-[9px] font-bold text-gray-400">Por: {h.users?.nome || 'Admin'}</span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                            h.aplicado ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                                                        )}>
                                                            Vigência: {new Date(h.data_inicio_vigencia).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Form */}
                            <div>
                                <h4 className="font-black text-[#0E3A8C] uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                                    <Calendar className="w-4 h-4" />
                                    Agendar Alteração
                                </h4>
                                
                                <form onSubmit={handleRegister} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">O que deseja alterar?</label>
                                        <select 
                                            value={tipoAlteracao}
                                            onChange={(e) => setTipoAlteracao(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-[#0E3A8C] focus:bg-white focus:border-blue-100 outline-none transition-all"
                                        >
                                            <option value="Professor">Professor</option>
                                            <option value="Sala">Sala</option>
                                            <option value="Horário">Horário</option>
                                            <option value="Dias">Dias da Semana</option>
                                        </select>
                                    </div>

                                    {tipoAlteracao === 'Professor' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Novo Professor</label>
                                            <select
                                                required
                                                value={novoProfessor}
                                                onChange={(e) => setNovoProfessor(e.target.value)}
                                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-gray-700 focus:bg-white focus:border-blue-100 outline-none transition-all"
                                            >
                                                <option value="">Selecione...</option>
                                                {professors.map(p => (
                                                    <option key={p.uuid} value={p.uuid}>{p.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {tipoAlteracao === 'Sala' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nova Sala</label>
                                            <select
                                                required
                                                value={novaSala}
                                                onChange={(e) => setNovaSala(e.target.value)}
                                                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-gray-700 focus:bg-white focus:border-blue-100 outline-none transition-all"
                                            >
                                                <option value="">Selecione...</option>
                                                {salas.map((s, i) => (
                                                    <option key={i} value={s.nome}>{s.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {tipoAlteracao === 'Horário' && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Das</label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={novoInicio}
                                                    onChange={(e) => setNovoInicio(e.target.value)}
                                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-gray-700 focus:bg-white focus:border-blue-100 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Até as</label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={novoFim}
                                                    onChange={(e) => setNovoFim(e.target.value)}
                                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-gray-700 focus:bg-white focus:border-blue-100 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {tipoAlteracao === 'Dias' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Novos Dias</label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAY_KEYS.map(key => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => {
                                                            if (novosDias.includes(key)) {
                                                                setNovosDias(novosDias.filter(d => d !== key));
                                                            } else {
                                                                setNovosDias([...novosDias, key]);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                                            novosDias.includes(key)
                                                                ? "bg-[#0E3A8C] text-white"
                                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                        )}
                                                    >
                                                        {DAY_MAP[key]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-4 border-t border-gray-100">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0E3A8C] ml-2 flex items-center gap-2">
                                            Data de Início da Vigência
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={dataVigencia}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setDataVigencia(e.target.value)}
                                            className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-3.5 font-black text-[#0E3A8C] focus:bg-white focus:border-blue-300 outline-none transition-all"
                                        />
                                        <p className="text-[9px] font-bold text-gray-400 ml-2 mt-1">A mudança será aplicada automaticamente nesta data.</p>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-[#0E3A8C] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 flex justify-center"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agendar Alteração'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
