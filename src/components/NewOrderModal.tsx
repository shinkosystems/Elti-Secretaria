import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Package, User, MapPin, School, Home, CheckCircle2 } from 'lucide-react';
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

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    materials: any[];
}

export function NewOrderModal({ isOpen, onClose, onSuccess, materials }: NewOrderModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [success, setSuccess] = useState(false);

    // Form Stats
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
    const [selectedStudentUuid, setSelectedStudentUuid] = useState<string | null>(null);
    const [addressType, setAddressType] = useState<'school' | 'home'>('school');

    useEffect(() => {
        if (isOpen && profile?.fk_colegio) {
            fetchStudents();
            fetchSchoolInfo();
        }
    }, [isOpen, profile]);

    const fetchStudents = async () => {
        setFetchingStudents(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .contains('tipousuario', ['Student'])
                .eq('fk_colegio', profile?.fk_colegio)
                .order('nome');

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setFetchingStudents(false);
        }
    };

    const fetchSchoolInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('colegios')
                .select('*')
                .eq('id', profile?.fk_colegio)
                .single();

            if (error) throw error;
            setSchoolInfo(data);
        } catch (error) {
            console.error('Error fetching school info:', error);
        }
    };

    const selectedStudent = students.find(s => s.uuid === selectedStudentUuid);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterialId || !selectedStudentUuid || !profile) return;

        setLoading(true);
        try {
            const material = materials.find(m => m.id === selectedMaterialId);

            let deliveryAddress = '';
            if (addressType === 'school' && schoolInfo) {
                deliveryAddress = `Escola: ${schoolInfo.rua}, ${schoolInfo.numero} - ${schoolInfo.bairro}, ${schoolInfo.cidade}/${schoolInfo.estado} (CEP: ${schoolInfo.cep})`;
            } else if (addressType === 'home' && selectedStudent) {
                deliveryAddress = `Residencial: ${selectedStudent.logradouro || 'N/A'}, ${selectedStudent.numero || 'N/A'} - ${selectedStudent.bairro || 'N/A'}, ${selectedStudent.cidade || 'N/A'}/${selectedStudent.uf || 'N/A'} (CEP: ${selectedStudent.cep || 'N/A'})`;
            }

            const { error } = await supabase
                .from('pedidos_materiais')
                .insert([{
                    fk_colegio: profile.fk_colegio,
                    fk_usuario: selectedStudentUuid,
                    fk_material: selectedMaterialId,
                    item_nome: material?.nome || 'Material',
                    status: 'Pedido Feito',
                    endereco_entrega: deliveryAddress
                }]);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSuccess();
                onClose();
                resetForm();
            }, 2000);
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Erro ao criar pedido. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedMaterialId(null);
        setSelectedStudentUuid(null);
        setAddressType('school');
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
                        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden border border-white my-8"
                    >
                        {/* Header */}
                        <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px]">
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
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Novo Pedido</h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-10">
                            {/* Material Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                    <Package className="w-3 h-3" />
                                    Material Didático
                                </label>
                                <SearchableSelect
                                    options={materials.map(m => ({ id: m.id, label: m.nome }))}
                                    value={selectedMaterialId || 0}
                                    onChange={(id) => setSelectedMaterialId(id || null)}
                                    placeholder="Selecione o material..."
                                    className="w-full"
                                />
                            </div>

                            {/* Student Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Aluno Receptor
                                </label>
                                {fetchingStudents ? (
                                    <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-[24px] text-gray-400 font-bold text-sm italic">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando lista de alunos...
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={students.map(s => ({
                                            id: s.uuid, // Using UUID as ID for the select
                                            label: s.nome,
                                            description: s.email
                                        }))}
                                        value={selectedStudentUuid || ""}
                                        onChange={(uuid) => setSelectedStudentUuid(uuid || null)}
                                        placeholder="Selecione o aluno..."
                                        className="w-full"
                                    />
                                )}
                            </div>

                            {/* Address Selection */}
                            {selectedStudentUuid && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-6 pt-4 border-t border-gray-100"
                                >
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" />
                                        Local de Entrega
                                    </label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setAddressType('school')}
                                            className={cn(
                                                "p-6 rounded-[24px] border-2 transition-all flex flex-col gap-3 group relative overflow-hidden",
                                                addressType === 'school'
                                                    ? "border-[#0E3A8C] bg-blue-50/30 shadow-lg shadow-blue-900/5"
                                                    : "border-gray-50 bg-gray-50/30 hover:border-gray-100"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                    addressType === 'school' ? "bg-[#0E3A8C] text-white" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <School className="w-5 h-5" />
                                                </div>
                                                {addressType === 'school' && <div className="w-4 h-4 rounded-full bg-[#0E3A8C] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                            </div>
                                            <div className="text-left">
                                                <span className={cn(
                                                    "block font-black text-xs uppercase tracking-wider",
                                                    addressType === 'school' ? "text-[#0E3A8C]" : "text-gray-400"
                                                )}>Retirar na Escola</span>
                                                <span className="text-[10px] text-gray-400 font-bold line-clamp-2 mt-1">
                                                    {schoolInfo ? `${schoolInfo.rua}, ${schoolInfo.numero}` : 'Endereço da Unidade'}
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAddressType('home')}
                                            className={cn(
                                                "p-6 rounded-[24px] border-2 transition-all flex flex-col gap-3 group relative overflow-hidden",
                                                addressType === 'home'
                                                    ? "border-[#0E3A8C] bg-blue-50/30 shadow-lg shadow-blue-900/5"
                                                    : "border-gray-50 bg-gray-50/30 hover:border-gray-100"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                    addressType === 'home' ? "bg-[#0E3A8C] text-white" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <Home className="w-5 h-5" />
                                                </div>
                                                {addressType === 'home' && <div className="w-4 h-4 rounded-full bg-[#0E3A8C] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                            </div>
                                            <div className="text-left">
                                                <span className={cn(
                                                    "block font-black text-xs uppercase tracking-wider",
                                                    addressType === 'home' ? "text-[#0E3A8C]" : "text-gray-400"
                                                )}>Entrega em Casa</span>
                                                <span className="text-[10px] text-gray-400 font-bold line-clamp-2 mt-1">
                                                    {selectedStudent?.logradouro ? `${selectedStudent.logradouro}, ${selectedStudent.numero}` : 'Endereço Residencial'}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Alert for empty student address if selected */}
                            {addressType === 'home' && selectedStudent && !selectedStudent.logradouro && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600"
                                >
                                    <X className="w-5 h-5 shrink-0" />
                                    <p className="text-[10px] font-black uppercase tracking-wider">Atenção: Endereço do aluno não cadastrado!</p>
                                </motion.div>
                            )}

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedMaterialId || !selectedStudentUuid || (addressType === 'home' && !selectedStudent?.logradouro)}
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
                                            Pedido Realizado!
                                        </>
                                    ) : (
                                        'Confirmar Pedido'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
