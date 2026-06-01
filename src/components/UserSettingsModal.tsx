import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, BookOpen, GraduationCap, CheckCircle2, User, ChevronRight, Search, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';


interface Turma {
    id: number;
    nome: string;
    sala?: string;
    professor?: { nome: string };
    users?: { nome: string }[];
}


interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: number;
        nome: string;
        tipousuario: string[] | string | null;
        idbooks: number | null;
        fk_turma: number | null;
        foto: string | null;
    } | null;
    fk_colegio: number | null;
    onSuccess: () => void;
}

const BOOK_LEVELS = [
    { id: 1, label: 'Freshman' },
    { id: 2, label: 'Sophomore' },
    { id: 3, label: 'Junior' },
    { id: 4, label: 'Sênior' }
];

const AVAILABLE_ROLES = [
    { id: 'Student', label: 'Aluno' },
    { id: 'Teacher', label: 'Professor' },
    { id: 'Manager', label: 'Gerente' },
    { id: 'Secretary', label: 'Secretário' },
    { id: 'Supervisor', label: 'Supervisor' }
];

export function UserSettingsModal({ isOpen, onClose, user, fk_colegio, onSuccess }: UserSettingsModalProps) {
    const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
    const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [activeTab, setActiveTab] = useState<'config' | 'info'>('info');

    useEffect(() => {
        if (isOpen && user) {
            const rawRoles = Array.isArray(user.tipousuario)
                ? user.tipousuario
                : user.tipousuario
                    ? [user.tipousuario]
                    : [];

            // Normalize roles: split strings with commas and trim
            const cleanedRoles = rawRoles.flatMap(r =>
                typeof r === 'string' ? r.split(',').map(s => s.trim()) : []
            ).filter(Boolean);

            // Remove duplicates
            const uniqueRoles = Array.from(new Set(cleanedRoles));

            setSelectedRoles(uniqueRoles);
            setActiveTab(uniqueRoles.includes('Student') ? 'config' : 'info');
        }
    }, [isOpen, user]);
    const [loading, setLoading] = useState(false);
    const [fetchingTurmas, setFetchingTurmas] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [success, setSuccess] = useState(false);

    // User Info States
    const [formData, setFormData] = useState<any>({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        responsavel_financeiro: '',
        cpf_responsavel_financeiro: '',
        nascimento: '',
        genero: '',
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
        numero: '',
        complemento: ''
    });
    const [loadingCep, setLoadingCep] = useState(false);


    useEffect(() => {
        if (isOpen && user) {
            setSelectedBookId(user.idbooks);
            setSelectedTurmaId(user.fk_turma);
            fetchTurmas();
            fetchFullUserData();
        }
    }, [isOpen, user]);

    const fetchFullUserData = async () => {
        if (!user?.id) return;
        setFetchingUser(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    nome: data.nome || '',
                    email: data.email || '',
                    telefone: data.telefone || '',
                    cpf: data.cpf || '',
                    responsavel_financeiro: data.responsavel_financeiro || '',
                    cpf_responsavel_financeiro: data.cpf_responsavel_financeiro || '',
                    nascimento: data.nascimento || '',
                    genero: data.genero || '',
                    cep: data.cep || '',
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || '',
                    uf: data.uf || '',
                    numero: data.numero || '',
                    complemento: data.complemento || ''
                });
            }
        } catch (err) {
            console.error('Error fetching full user data:', err);
        } finally {
            setFetchingUser(false);
        }
    };


    const fetchTurmas = async () => {
        if (!fk_colegio) return;
        setFetchingTurmas(true);
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select(`
                    id, 
                    nome,
                    sala,
                    professor:users!professor_uuid(nome),
                    users(nome)
                `)
                .eq('fk_colegio', fk_colegio)
                .eq('ativo', true)
                .order('nome');

            if (error) throw error;
            setTurmas(data as any || []);
        } catch (error) {
            console.error('Error fetching turmas:', error);
        } finally {
            setFetchingTurmas(false);
        }
    };


    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    idbooks: selectedBookId,
                    fk_turma: selectedTurmaId,
                    tipousuario: selectedRoles,
                    ...formData
                })
                .eq('id', user.id);


            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error updating student settings:', error);
            alert('Erro ao salvar as configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleCepBlur = async () => {
        const cleanedCep = (formData.cep || '').replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;

        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData((prev: any) => ({
                    ...prev,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    uf: data.uf
                }));

                setTimeout(() => {
                    const numeroInput = document.getElementById('edit_num_input');
                    if (numeroInput) numeroInput.focus();
                }, 100);
            }
        } catch (err) {
            console.error('Error fetching CEP:', err);
        } finally {
            setLoadingCep(false);
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                            {/* Dot Pattern */}
                            <div
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                        {selectedRoles.includes('Student') ? 'Configurações do Aluno' : 'Configurações do Usuário'}
                                    </h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-white/10 rounded-2xl transition-all shadow-inner backdrop-blur-sm"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                        {user?.foto ? (
                                            <img src={user.foto} alt={user.nome || 'Usuário'} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <p className="text-white font-bold text-sm">{user?.nome || 'Usuário'}</p>
                                </div>
                                {selectedRoles.includes('Student') && (
                                    <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md border border-white/10">
                                        <button
                                            onClick={() => setActiveTab('config')}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                activeTab === 'config' ? "bg-white text-[#0E3A8C] shadow-lg" : "text-white/60 hover:text-white"
                                            )}
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            Livro & Turma
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('info')}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                activeTab === 'info' ? "bg-white text-[#0E3A8C] shadow-lg" : "text-white/60 hover:text-white"
                                            )}
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            Informações
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-10 space-y-10">
                                {/* Role Management Section - ALWAYS VISIBLE */}
                                <section>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-[20px] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Cargos & Funções</h4>
                                            <p className="text-gray-400 text-[10px] font-bold">Defina as permissões de acesso do usuário</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {AVAILABLE_ROLES.map((role) => {
                                            const isSelected = selectedRoles.includes(role.id);
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedRoles(selectedRoles.filter(r => r !== role.id));
                                                        } else {
                                                            setSelectedRoles([...selectedRoles, role.id]);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-2",
                                                        isSelected
                                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-900/20"
                                                            : "bg-white text-gray-400 border-gray-100 hover:border-indigo-100"
                                                    )}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    {role.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                                {activeTab === 'config' ? (
                                    <>
                                        {/* Book Selection */}
                                        <section>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-[20px] bg-blue-50 flex items-center justify-center text-[#0E3A8C] shadow-inner">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Nível do Livro</h4>
                                                    <p className="text-gray-400 text-[10px] font-bold">Defina o material didático do aluno</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {BOOK_LEVELS.map((level) => (
                                                    <button
                                                        key={level.id}
                                                        onClick={() => setSelectedBookId(level.id)}
                                                        className={cn(
                                                            "p-6 rounded-[24px] border-2 transition-all flex items-center justify-between group relative overflow-hidden",
                                                            selectedBookId === level.id
                                                                ? "border-[#0E3A8C] bg-white shadow-xl shadow-blue-900/10"
                                                                : "border-transparent bg-white hover:border-gray-100 shadow-sm"
                                                        )}
                                                    >
                                                        {selectedBookId === level.id && (
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#0E3A8C]" />
                                                        )}
                                                        <span className={cn(
                                                            "font-black text-sm tracking-tight",
                                                            selectedBookId === level.id ? "text-[#0E3A8C]" : "text-gray-400 group-hover:text-gray-600"
                                                        )}>
                                                            {level.label}
                                                        </span>
                                                        {selectedBookId === level.id && (
                                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                                <CheckCircle2 className="w-4 h-4 text-[#0E3A8C]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setSelectedBookId(null)}
                                                    className={cn(
                                                        "p-6 rounded-[24px] border-2 transition-all text-center font-black text-sm",
                                                        selectedBookId === null
                                                            ? "border-red-200 bg-white text-red-600 shadow-xl shadow-red-900/10"
                                                            : "border-transparent bg-white text-gray-300 hover:text-red-400 shadow-sm"
                                                    )}
                                                >
                                                    Sem Acesso
                                                </button>
                                            </div>
                                        </section>

                                        {/* Class Assignment */}
                                        <section>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-[20px] bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                                                    <GraduationCap className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Alocação de Turma</h4>
                                                    <p className="text-gray-400 text-[10px] font-bold">Vincule o aluno a um grupo de estudos</p>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                {fetchingTurmas ? (
                                                    <div className="flex items-center gap-4 p-5 bg-white rounded-[24px] text-gray-400 font-bold shadow-sm">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Sincronizando turmas...
                                                    </div>
                                                ) : (
                                                    <SearchableSelect
                                                        options={[
                                                            { id: 0, label: 'Nenhuma Turma Atribuída' },
                                                            ...turmas.map(t => ({
                                                                id: t.id,
                                                                label: t.nome,
                                                                description: `${t.sala ? `Sala: ${t.sala}` : ''}${t.professor ? ` | Prof: ${t.professor.nome}` : ''}`,
                                                                ...t
                                                            }))
                                                        ]}
                                                        value={selectedTurmaId || 0}
                                                        onChange={(val) => setSelectedTurmaId(val === 0 ? null : val)}
                                                        placeholder="Selecione uma turma..."
                                                        searchPlaceholder="Busque por sala, prof ou alunos..."
                                                        customFilter={(option, term) => {
                                                            if (option.id === 0) return option.label.toLowerCase().includes(term.toLowerCase());
                                                            const t = option as any;
                                                            const search = term.toLowerCase();
                                                            return (
                                                                (t.nome?.toLowerCase() || '').includes(search) ||
                                                                (t.sala?.toLowerCase().includes(search) ?? false) ||
                                                                (t.professor?.nome?.toLowerCase() || '').includes(search) ||
                                                                (t.users?.some((u: any) => (u.nome?.toLowerCase() || '').includes(search)) ?? false)
                                                            );
                                                        }}
                                                        className="w-full"
                                                    />
                                                )}
                                            </div>
                                        </section>
                                    </>
                                ) : (
                                    <>
                                        {fetchingUser ? (
                                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                                <p className="font-bold">Carregando dados...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-[20px] bg-blue-50 flex items-center justify-center text-[#0E3A8C] shadow-inner">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Dados Pessoais</h4>
                                                        <p className="text-gray-400 text-[10px] font-bold">Informações básicas do cadastro</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Nome Completo</label>
                                                        <input
                                                            type="text"
                                                            value={formData.nome}
                                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Endereço de E-mail</label>
                                                        <input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Telefone</label>
                                                        <input
                                                            type="text"
                                                            value={formData.telefone}
                                                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                            placeholder="(00) 0 0000-0000"
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">CPF</label>
                                                        <input
                                                            type="text"
                                                            value={formData.cpf}
                                                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                                            placeholder="000.000.000-00"
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6 mt-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Responsável Financeiro</label>
                                                        <input
                                                            type="text"
                                                            value={formData.responsavel_financeiro}
                                                            onChange={(e) => setFormData({ ...formData, responsavel_financeiro: e.target.value })}
                                                            placeholder="Nome do responsável"
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">CPF do Resp. Financeiro</label>
                                                        <input
                                                            type="text"
                                                            value={formData.cpf_responsavel_financeiro}
                                                            onChange={(e) => setFormData({ ...formData, cpf_responsavel_financeiro: e.target.value })}
                                                            placeholder="000.000.000-00"
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Data de Nascimento</label>
                                                        <input
                                                            type="date"
                                                            value={formData.nascimento}
                                                            onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight appearance-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Gênero</label>
                                                        <select
                                                            value={formData.genero}
                                                            onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                                                            className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Selecione...</option>
                                                            <option value="M">Masculino</option>
                                                            <option value="F">Feminino</option>
                                                            <option value="O">Outro</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-10 pt-10 border-t border-gray-100 mt-10">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-[20px] bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                                                            <GraduationCap className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-[#0E3A8C] uppercase tracking-[0.2em] text-xs">Endereço Residencial</h4>
                                                            <p className="text-gray-400 text-[10px] font-bold">Localização atual registrada</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-6">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">CEP</label>
                                                            <div className="relative group">
                                                                <input
                                                                    type="text"
                                                                    value={formData.cep}
                                                                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                                                    onBlur={handleCepBlur}
                                                                    placeholder="00000-000"
                                                                    className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                                />
                                                                {loadingCep && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0E3A8C] animate-spin" />}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Logradouro (Rua/Av)</label>
                                                            <input
                                                                type="text"
                                                                value={formData.logradouro}
                                                                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                                                                placeholder="Rua das Flores"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Número</label>
                                                            <input
                                                                id="edit_num_input"
                                                                type="text"
                                                                value={formData.numero}
                                                                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                                                placeholder="123"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Complemento</label>
                                                            <input
                                                                type="text"
                                                                value={formData.complemento}
                                                                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                                                                placeholder="Apt 101"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-6">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Bairro</label>
                                                            <input
                                                                type="text"
                                                                value={formData.bairro}
                                                                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                                                placeholder="Centro"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Cidade</label>
                                                            <input
                                                                type="text"
                                                                value={formData.cidade}
                                                                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                                                placeholder="São Paulo"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">UF</label>
                                                            <input
                                                                type="text"
                                                                value={formData.uf}
                                                                onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                                                                placeholder="SP"
                                                                className="w-full bg-white border-2 border-transparent hover:border-blue-50/50 shadow-sm rounded-[24px] p-6 font-black text-[#0E3A8C] outline-none focus:border-[#0E3A8C] focus:ring-4 focus:ring-blue-50/50 transition-all text-sm tracking-tight placeholder:text-gray-300"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-10 bg-white/50 backdrop-blur-md border-t border-gray-100 flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-white transition-all active:scale-95 shadow-sm"
                            >
                                Descartar
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
                                        Salvo com Sucesso
                                    </>
                                ) : (
                                    'Aplicar Configurações'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
