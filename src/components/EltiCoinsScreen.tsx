import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Coins,
    Search,
    ArrowDownCircle,
    Loader2,
    AlertCircle,
    X,
    UserCircle,
    Trash2,
    ChevronRight,
    History,
    Calendar,
    Users,
    GraduationCap,
    BookOpen,
    ArrowUpCircle,
    Package,
    Plus,
    Edit2,
    CheckCircle,
    User,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function EltiCoinsScreen() {
    const { profile } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [removeAmount, setRemoveAmount] = useState('');
    const [justification, setJustification] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ nome: '', preco: '', estoque: '' });
    const [selectedProductId, setSelectedProductId] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'products'>('students');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [stockAdjustment, setStockAdjustment] = useState('');
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalProducts: 0,
        totalCoins: 0
    });

    useEffect(() => {
        if (profile?.fk_colegio) {
            fetchStudents();
            fetchProducts();
            fetchStats();
        }
    }, [profile]);

    const fetchStats = async () => {
        if (!profile?.fk_colegio) return;
        try {
            const { count: studentCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .contains('tipousuario', ['Student'])
                .eq('fk_colegio', profile.fk_colegio);

            const { count: productCount } = await supabase
                .from('produtos')
                .select('*', { count: 'exact', head: true })
                .eq('fk_colegio', profile.fk_colegio);

            const { data: coinsData } = await supabase
                .from('users')
                .select('coins')
                .eq('fk_colegio', profile.fk_colegio)
                .is('coins', 'not.null');

            const totalCoins = coinsData?.reduce((acc, curr) => acc + (curr.coins || 0), 0) || 0;

            setStats({
                totalStudents: studentCount || 0,
                totalProducts: productCount || 0,
                totalCoins
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchProducts = async () => {
        if (!profile?.fk_colegio) return;
        try {
            const { data } = await supabase
                .from('produtos')
                .select('*')
                .eq('fk_colegio', profile.fk_colegio)
                .order('nome');
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchStudents = async () => {
        if (!profile?.fk_colegio) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('users')
                .select('id, nome, email, coins, foto')
                .eq('fk_colegio', profile.fk_colegio)
                .contains('tipousuario', ['Student'])
                .order('nome');

            if (data) setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentHistory = async (studentId: number) => {
        setHistoryLoading(true);
        try {
            const { data } = await supabase
                .from('elticoin_historico')
                .select('*')
                .eq('fk_aluno', studentId)
                .order('created_at', { ascending: false });
            if (data) setStudentHistory(data);
        } catch (error) {
            console.error('Error fetching student history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleRegisterProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.fk_colegio || !newProduct.nome || !newProduct.preco || !newProduct.estoque) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('produtos')
                .insert({
                    nome: newProduct.nome,
                    preco: parseInt(newProduct.preco),
                    estoque: parseInt(newProduct.estoque),
                    fk_colegio: profile.fk_colegio
                });

            if (error) throw error;

            setIsProductModalOpen(false);
            setNewProduct({ nome: '', preco: '', estoque: '' });
            fetchProducts();
            alert('Produto cadastrado com sucesso!');
        } catch (error) {
            console.error('Error registering product:', error);
            alert('Erro ao cadastrar produto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !editingProduct.nome || !editingProduct.preco || !editingProduct.estoque) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('produtos')
                .update({
                    nome: editingProduct.nome,
                    preco: parseInt(editingProduct.preco),
                    estoque: parseInt(editingProduct.estoque)
                })
                .eq('id', editingProduct.id);

            if (error) throw error;

            setEditingProduct(null);
            setStockAdjustment('');
            fetchProducts();
            alert('Produto atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Erro ao atualizar produto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchProducts();
            alert('Produto excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Erro ao excluir produto');
        }
    };

    const handleRemoveCoins = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !removeAmount || !justification) return;

        setSubmitting(true);
        try {
            const amount = parseInt(removeAmount);
            const newBalance = (selectedStudent.coins || 0) - amount;

            if (newBalance < 0) {
                alert('O aluno não tem coins suficientes.');
                setSubmitting(false);
                return;
            }

            // 1. Update user coins
            const { error: updateError } = await supabase
                .from('users')
                .update({ coins: newBalance })
                .eq('id', selectedStudent.id);

            if (updateError) throw updateError;

            // 2. Decrement product stock if applicable
            let productName = '';
            if (selectedProductId) {
                const product = products.find(p => p.id === selectedProductId);
                if (product) {
                    productName = product.nome;
                    const { error: stockError } = await supabase
                        .from('produtos')
                        .update({ estoque: Math.max(0, product.estoque - 1) })
                        .eq('id', selectedProductId);

                    if (stockError) console.error('Error updating stock:', stockError);
                }
            }

            // 3. Log transaction to history
            const { error: historyError } = await supabase
                .from('elticoin_historico')
                .insert({
                    nome_produto: productName || null,
                    fk_colegio: profile.fk_colegio,
                    fk_aluno: selectedStudent.id,
                    coins_removidas: amount,
                    fk_produto: selectedProductId || null,
                    justificativa: productName ? null : justification
                });

            if (historyError) throw historyError;

            setIsModalOpen(false);
            setRemoveAmount('');
            setJustification('');
            setSelectedStudent(null);
            setSelectedProductId(null);
            fetchStudents();
            fetchProducts();
        } catch (error) {
            console.error('Error removing coins:', error);
            alert('Erro ao remover coins');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s =>
        (s.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Users}
                    label="Alunos"
                    value={stats.totalStudents}
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={Package}
                    label="Produtos"
                    value={stats.totalProducts}
                    color="text-green-500"
                    bgColor="bg-green-50"
                />
                <StatCard
                    icon={Coins}
                    label="Coins em Circulação"
                    value={stats.totalCoins}
                    color="text-yellow-500"
                    bgColor="bg-yellow-50"
                />
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <h3 className="text-2xl font-black text-[#0E3A8C] flex items-center gap-3">
                            Gestão de ELTI Coins
                            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                                {activeTab === 'students' ? filteredStudents.length : products.length} total
                            </span>
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'students' ? "Buscar aluno..." : "Buscar produto..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-gray-50 border-none rounded-2xl py-3 pl-10 pr-6 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('students')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                        activeTab === 'students'
                                            ? "bg-[#0E3A8C] text-white shadow-lg shadow-blue-900/20"
                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    Alunos
                                </button>
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                        activeTab === 'products'
                                            ? "bg-[#0E3A8C] text-white shadow-lg shadow-blue-900/20"
                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    Produtos
                                </button>

                                {activeTab === 'products' && (
                                    <button
                                        onClick={() => setIsProductModalOpen(true)}
                                        className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Novo Produto
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'students' ? (
                        <>
                            {loading ? (
                                <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                    <p className="font-bold">Carregando alunos...</p>
                                </div>
                            ) : filteredStudents.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aluno</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Atual</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="p-6">
                                                    <div
                                                        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all group/info"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            fetchStudentHistory(student.id);
                                                            setIsHistoryModalOpen(true);
                                                        }}
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#0E3A8C] font-black shadow-sm overflow-hidden text-sm uppercase group-hover/info:scale-105 transition-transform">
                                                            {student.foto ? (
                                                                <img src={student.foto} alt={student.nome} className="w-full h-full object-cover" />
                                                            ) : (
                                                                student.nome.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-[#0E3A8C] text-sm flex items-center gap-2">
                                                                {student.nome}
                                                                <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover/info:opacity-100 group-hover/info:translate-x-1 transition-all" />
                                                            </div>
                                                            <div className="text-xs text-gray-400 font-bold">{student.email || 'Sem email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                                                            <Coins className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-black text-[#0E3A8C] text-lg tracking-tight">
                                                            {student.coins || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                        (student.coins || 0) > 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                                                    )}>
                                                        {(student.coins || 0) > 0 ? 'Com Saldo' : 'Sem Coins'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="bg-[#0E3A8C] text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#0a2b66] transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2 ml-auto"
                                                    >
                                                        <ArrowDownCircle className="w-3 h-3" />
                                                        Subtrair
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center text-gray-300">
                                    <UserCircle className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-black text-xl">Nenhum aluno encontrado</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {products.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estoque</th>
                                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0E3A8C] shadow-sm">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div className="font-black text-[#0E3A8C] text-sm">{product.nome}</div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                                                            <Coins className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-black text-[#0E3A8C] text-lg tracking-tight">
                                                            {product.preco}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm font-bold text-[#0E3A8C]">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                        product.estoque > 5 ? "bg-green-50 text-green-600" :
                                                            product.estoque > 0 ? "bg-orange-50 text-orange-600" :
                                                                "bg-red-50 text-red-600"
                                                    )}>
                                                        {product.estoque} unidades
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingProduct(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center text-gray-300">
                                    <Package className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-black text-xl">Nenhum produto cadastrado</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Removal Modal */}
            <AnimatePresence>
                {isModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white"
                        >
                            <div className="p-10 bg-red-600 text-white relative overflow-hidden rounded-b-[40px]">
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                                <div className="flex items-center gap-6 mb-2 relative z-10">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                        <History className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Subtrair Coins</h3>
                                        <p className="text-red-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                        {selectedStudent.foto ? (
                                            <img src={selectedStudent.foto} alt={selectedStudent.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <p className="text-white font-bold text-sm">{selectedStudent.nome}</p>
                                </div>
                            </div>

                            <form onSubmit={handleRemoveCoins} className="p-10 space-y-8">
                                {products.length > 0 && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Trocar por Produto (Opcional)</label>
                                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar p-1">
                                            <label className="flex items-center gap-4 p-5 rounded-[24px] bg-white border-2 border-transparent cursor-pointer transition-all hover:bg-red-50/30 has-[:checked]:border-red-500 has-[:checked]:bg-red-50 has-[:checked]:shadow-xl has-[:checked]:shadow-red-900/5 shadow-sm group">
                                                <input
                                                    type="radio"
                                                    name="product"
                                                    value=""
                                                    checked={!selectedProductId}
                                                    onChange={() => {
                                                        setSelectedProductId(null);
                                                        setRemoveAmount('');
                                                        setJustification('');
                                                    }}
                                                    className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-100"
                                                />
                                                <span className="font-black text-sm text-[#0E3A8C] group-has-[:checked]:text-red-700">Nenhum produto (Subtração Manual)</span>
                                            </label>
                                            {products.filter(p => p.estoque > 0).map(product => (
                                                <label key={product.id} className="flex items-center gap-4 p-5 rounded-[24px] bg-white border-2 border-transparent cursor-pointer transition-all hover:bg-red-50/30 has-[:checked]:border-red-500 has-[:checked]:bg-red-50 has-[:checked]:shadow-xl has-[:checked]:shadow-red-900/5 shadow-sm group">
                                                    <input
                                                        type="radio"
                                                        name="product"
                                                        value={product.id}
                                                        checked={selectedProductId === product.id}
                                                        onChange={() => {
                                                            setSelectedProductId(product.id);
                                                            setRemoveAmount(product.preco.toString());
                                                            setJustification(`Troca pelo produto: ${product.nome}`);
                                                        }}
                                                        className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-100"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-black text-sm text-[#0E3A8C] group-has-[:checked]:text-red-700">{product.nome}</div>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="px-3 py-1 bg-yellow-50 rounded-lg text-[10px] font-black text-yellow-700 uppercase flex items-center gap-1.5 shadow-inner">
                                                                <Coins className="w-3 h-3" />
                                                                {product.preco} coins
                                                            </div>
                                                            <div className="px-3 py-1 bg-blue-50/50 rounded-lg text-[10px] font-black text-blue-400/80 uppercase shadow-inner">
                                                                Esq: {product.estoque}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 items-end">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Quantidade</label>
                                        <div className="relative group">
                                            <Coins className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-red-600" />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={selectedStudent.coins || 0}
                                                placeholder="0"
                                                value={removeAmount}
                                                onChange={(e) => setRemoveAmount(e.target.value)}
                                                className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-red-100 focus:ring-4 focus:ring-red-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-red-50/50 border border-red-100 rounded-[20px] p-5 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                                        <p className="text-xl font-black text-red-600 tracking-tight">{selectedStudent.coins || 0} <span className="text-xs uppercase ml-1">Coins</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Justificativa da Subtração</label>
                                    <textarea
                                        required
                                        placeholder="Ex: Aluno realizou uma compra física no balcão."
                                        rows={4}
                                        value={justification}
                                        onChange={(e) => setJustification(e.target.value)}
                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-red-100 focus:ring-4 focus:ring-red-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all transition-transform active:scale-95 shadow-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[1.5] bg-red-600 text-white font-black py-5 px-10 rounded-[24px] shadow-2xl shadow-red-900/30 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-red-700"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Confirmar Subtração
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Registration Modal */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                            onClick={() => setIsProductModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white"
                        >
                            <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px]">
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
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                                <div className="flex items-center gap-6 mb-2 relative z-10">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                        <Package className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Novo Produto</h3>
                                        <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleRegisterProduct} className="p-10 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nome do Produto</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Camiseta da Escola"
                                        value={newProduct.nome}
                                        onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-[#0E3A8C] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Preço (Coins)</label>
                                        <div className="relative">
                                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Ex: 100"
                                                value={newProduct.preco}
                                                onChange={(e) => setNewProduct({ ...newProduct, preco: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-[#0E3A8C] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estoque Inicial</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            placeholder="Ex: 10"
                                            value={newProduct.estoque}
                                            onChange={(e) => setNewProduct({ ...newProduct, estoque: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-[#0E3A8C] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsProductModalOpen(false)}
                                        className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[1.5] bg-[#0E3A8C] text-white font-black py-5 px-10 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-[#072a6b]"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Cadastrar Produto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Product Modal */}
            <AnimatePresence>
                {editingProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                            onClick={() => setEditingProduct(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white"
                        >
                            <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px]">
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
                                    onClick={() => setEditingProduct(null)}
                                    className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                                <div className="flex items-center gap-6 mb-2 relative z-10">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                        <Edit2 className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Editar Produto</h3>
                                        <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-3 relative z-10">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-white font-bold text-sm">{editingProduct.nome}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProduct} className="p-10 space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Nome do Produto</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingProduct.nome}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, nome: e.target.value })}
                                        className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Preço (Coins)</label>
                                    <div className="relative group">
                                        <Coins className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#0E3A8C]" />
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={editingProduct.preco}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, preco: e.target.value })}
                                            className="w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-5 pl-14 pr-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300 placeholder:font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Gerenciar Estoque</label>
                                    <div className="bg-white border-2 border-gray-50 rounded-[32px] p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status do Inventário</p>
                                                <p className="text-xl font-black text-[#0E3A8C]">Em Estoque</p>
                                            </div>
                                            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex flex-col items-center justify-center shadow-inner">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Qtd</span>
                                                <span className="text-2xl font-black text-[#0E3A8C]">{editingProduct.estoque}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Quantidade para ajustar"
                                                value={stockAdjustment}
                                                onChange={(e) => setStockAdjustment(e.target.value)}
                                                className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 font-black text-[#0E3A8C] outline-none focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-gray-300"
                                            />
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const adj = parseInt(stockAdjustment);
                                                        if (isNaN(adj)) return;
                                                        setEditingProduct({ ...editingProduct, estoque: editingProduct.estoque + adj });
                                                        setStockAdjustment('');
                                                    }}
                                                    className="flex-1 bg-green-500 text-white py-5 rounded-[20px] hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <Plus className="w-5 h-5" /> Adicionar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const adj = parseInt(stockAdjustment);
                                                        if (isNaN(adj)) return;
                                                        setEditingProduct({ ...editingProduct, estoque: Math.max(0, editingProduct.estoque - adj) });
                                                        setStockAdjustment('');
                                                    }}
                                                    className="flex-1 bg-red-500 text-white py-5 rounded-[20px] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <X className="w-5 h-5" /> Subtrair
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(null)}
                                        className="flex-1 py-5 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[1.5] bg-[#0E3A8C] text-white font-black py-5 px-10 rounded-[24px] shadow-2xl shadow-blue-900/30 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-[#072a6b]"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
                            onClick={() => setIsHistoryModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white"
                        >
                            <div className="p-10 bg-[#0E3A8C] text-white relative overflow-hidden rounded-b-[40px]">
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
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                                <div className="flex items-center gap-6 mb-2 relative z-10">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                        <History className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Histórico de Coins</h3>
                                        <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                        {selectedStudent.foto ? (
                                            <img src={selectedStudent.foto} alt={selectedStudent.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <p className="text-white font-bold text-sm">{selectedStudent.nome}</p>
                                </div>
                            </div>

                            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {historyLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                        <p className="font-bold">Carregando histórico...</p>
                                    </div>
                                ) : studentHistory.length > 0 ? (
                                    <div className="space-y-6">
                                        {studentHistory.map((item) => (
                                            <div key={item.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 last:before:hidden">
                                                <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                                    </div>
                                                    <div className="text-sm font-black text-red-600 flex items-center gap-1">
                                                        -{item.coins_removidas}
                                                        <Coins className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4">
                                                    <div className="font-bold text-[#0E3A8C] text-sm">
                                                        {item.nome_produto ? (
                                                            <span className="flex items-center gap-2">
                                                                <Package className="w-4 h-4 text-blue-500" />
                                                                Troca: {item.nome_produto}
                                                            </span>
                                                        ) : (
                                                            "Subtração Manual"
                                                        )}
                                                    </div>
                                                    {item.justificativa && (
                                                        <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed italic">
                                                            "{item.justificativa}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-300">
                                        <History className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="font-black text-lg text-center">Nenhuma transação<br />encontrada</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-gray-50">
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="w-full bg-gray-50 text-[#0E3A8C] font-black py-4 rounded-2xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-white/50 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner text-2xl", bgColor)}>
                <Icon className={cn("w-8 h-8", color)} />
            </div>
            <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</div>
                <div className="text-3xl font-black text-[#0E3A8C] tracking-tighter">{value}</div>
            </div>
        </div>
    );
}
