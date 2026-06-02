import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
    Package,
    ClipboardList,
    Plus,
    Loader2,
    Search,
    CheckCircle,
    Clock,
    X,
    Filter,
    ArrowRight,
    TrendingUp,
    History,
    AlertCircle,
    MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NewOrderModal } from './NewOrderModal';

export function MaterialsScreen() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'orders' | 'materials'>('orders');
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    useEffect(() => {
        if (profile?.fk_colegio) {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch materials
            const { data: materialsData } = await supabase
                .from('materiais')
                .select('*')
                .order('nome');
            if (materialsData) setMaterials(materialsData);

            // Always fetch orders
            let { data: ordersData, error: ordersError } = await supabase
                .from('pedidos_materiais')
                .select(`
                    *,
                    users:fk_usuario (nome, email)
                `)
                .eq('fk_colegio', profile?.fk_colegio)
                .order('data_pedido', { ascending: false });

            // Fallback if join failed
            if (ordersError) {
                console.error('Error fetching orders with join:', ordersError);
                const { data: fallbackData } = await supabase
                    .from('pedidos_materiais')
                    .select('*')
                    .eq('fk_colegio', profile?.fk_colegio)
                    .order('data_pedido', { ascending: false });
                if (fallbackData) {
                    ordersData = fallbackData;
                }
            }

            // Fetch users to map names manually as join might fail
            const { data: userData } = await supabase
                .from('users')
                .select('uuid, nome, email')
                .eq('fk_colegio', profile?.fk_colegio);

            if (ordersData) {
                const userMap = new Map(userData?.map(u => [u.uuid, u]) || []);
                const enrichedOrders = ordersData.map(o => ({
                    ...o,
                    users: o.users || userMap.get(o.fk_usuario)
                }));
                setOrders(enrichedOrders);
            }

        } catch (error) {
            console.error('Error fetching materials data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            const updates: any = { status: newStatus };
            if (newStatus === 'Entregue' || newStatus === 'Entregue ao Aluno') {
                updates.data_entrega = new Date().toISOString();
            }

            const { error } = await supabase
                .from('pedidos_materiais')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            // Logic to grant ELTI Plus access based on material name
            if (newStatus === 'Entregue' || newStatus === 'Entregue ao Aluno') {
                const order = orders.find(o => o.id === orderId);
                if (order && order.item_nome && order.fk_usuario) {
                    let mappedId = null;
                    const itemName = order.item_nome.toLowerCase();
                    if (itemName.includes('freshman')) mappedId = 1;
                    else if (itemName.includes('sophomore')) mappedId = 2;
                    else if (itemName.includes('junior')) mappedId = 3;
                    else if (itemName.includes('senior')) mappedId = 4;

                    if (mappedId !== null) {
                        const { error: userError } = await supabase
                            .from('users')
                            .update({ idbooks: mappedId })
                            .eq('uuid', order.fk_usuario);
                        
                        if (userError) {
                            console.error('Error updating user idbooks:', userError);
                        }
                    }
                }
            }

            fetchData();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const filteredMaterials = materials.filter(m =>
        (m.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const filteredOrders = orders.filter(o =>
        (o.item_nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (o.users?.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={ClipboardList}
                    label="Pedidos Novos"
                    value={orders.filter(o => o.status === 'Pedido Feito').length.toString()}
                    color="text-yellow-500"
                    bgColor="bg-yellow-50"
                />
                <StatCard
                    icon={Clock}
                    label="Em Processamento"
                    value={orders.filter(o => o.status === 'Em Processamento' || o.status === 'Enviado para Unidade').length.toString()}
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={Package}
                    label="Aguardando Aluno"
                    value={orders.filter(o => o.status === 'Recebido na Unidade').length.toString()}
                    color="text-purple-500"
                    bgColor="bg-purple-50"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Total Entregue"
                    value={orders.filter(o => o.status === 'Entregue' || o.status === 'Entregue ao Aluno').length.toString()}
                    color="text-green-500"
                    bgColor="bg-green-50"
                />
            </div>

            {/* Main Container */}
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
                {/* Tabs & Search Header */}
                <div className="p-8 border-b border-gray-100 bg-[#F9FAFB]/50 backdrop-blur-md">
                    <div className="flex flex-col lg:flex-row gap-8 justify-between items-center">
                        <div className="flex bg-gray-100 p-1.5 rounded-[24px] w-full lg:w-auto shadow-inner">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={cn(
                                    "flex-1 lg:flex-none px-8 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3",
                                    activeTab === 'orders' ? "bg-white text-[#0E3A8C] shadow-lg" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <ClipboardList className="w-4 h-4" />
                                Pedidos
                            </button>
                            <button
                                onClick={() => setActiveTab('materials')}
                                className={cn(
                                    "flex-1 lg:flex-none px-8 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3",
                                    activeTab === 'materials' ? "bg-white text-[#0E3A8C] shadow-lg" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Package className="w-4 h-4" />
                                Materiais
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0E3A8C] transition-colors" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'orders' ? "Buscar pedido ou usuário..." : "Buscar material..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border-2 border-gray-100 rounded-[24px] py-4 pl-14 pr-6 font-bold text-sm focus:outline-none focus:border-[#0E3A8C]/20 focus:ring-4 focus:ring-[#0E3A8C]/5 transition-all"
                                />
                            </div>
                            {activeTab === 'orders' && (
                                <button
                                    onClick={() => setIsRegisterModalOpen(true)}
                                    className="bg-brand-red text-white font-black py-4 px-8 rounded-full shadow-lg shadow-brand-red/20 flex items-center gap-3 active:scale-95 transition-all shrink-0"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="text-xs uppercase tracking-widest text-white">Novo Pedido</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <Loader2 className="w-12 h-12 animate-spin mb-6 text-[#0E3A8C] opacity-20" />
                            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Carregando Informações...</p>
                        </div>
                    ) : activeTab === 'orders' ? (
                        <OrdersTable orders={filteredOrders} onUpdateStatus={handleUpdateStatus} />
                    ) : (
                        <MaterialsTable materials={filteredMaterials} />
                    )}
                </div>
            </div>

            <NewOrderModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSuccess={fetchData}
                materials={materials}
            />
        </div>
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

function OrdersTable({ orders, onUpdateStatus }: { orders: any[], onUpdateStatus: (id: number, status: string) => void }) {
    if (orders.length === 0) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                <ClipboardList className="w-16 h-16 mb-6 opacity-20" />
                <p className="font-black text-xl text-center">Nenhum pedido<br />encontrado</p>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pedido Feito':
                return "bg-yellow-50 text-yellow-600 border border-yellow-100";
            case 'Em Processamento':
                return "bg-blue-50 text-blue-600 border border-blue-100";
            case 'Enviado para Unidade':
                return "bg-indigo-50 text-indigo-600 border border-indigo-100";
            case 'Recebido na Unidade':
                return "bg-purple-50 text-purple-600 border border-purple-100";
            case 'Entregue ao Aluno':
            case 'Entregue':
                return "bg-green-50 text-green-600 border border-green-100";
            case 'Negado':
                return "bg-red-50 text-red-600 border border-red-100";
            default:
                return "bg-gray-50 text-gray-400 border border-gray-100";
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'Pedido Feito': return "bg-yellow-500 animate-pulse";
            case 'Em Processamento': return "bg-blue-500";
            case 'Enviado para Unidade': return "bg-indigo-500";
            case 'Recebido na Unidade': return "bg-purple-500";
            case 'Entregue ao Aluno':
            case 'Entregue': return "bg-green-500";
            case 'Negado': return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-[#F9FAFB]">
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Usuário</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Material</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Local de Entrega</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status Atual</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Data</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Ações de Gestão</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#F3F4F6]/30 transition-all group">
                            <td className="px-10 py-8">
                                <div className="flex flex-col">
                                    <span className="font-black text-[#0E3A8C] text-sm tracking-tight">{order.users?.nome || 'Usuário'}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.users?.email}</span>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="font-bold text-[#0E3A8C] text-sm uppercase">{order.item_nome}</span>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className="flex items-center gap-3 max-w-[200px]">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-[10px] font-bold text-gray-500 line-clamp-2 uppercase tracking-tighter italic">
                                        {order.endereco_entrega || 'Não informado'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm",
                                    getStatusStyles(order.status || 'Pedido Feito')
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", getStatusDotColor(order.status || 'Pedido Feito'))} />
                                    {order.status || "Pedido Feito"}
                                </span>
                            </td>
                            <td className="px-10 py-8">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest italic">{new Date(order.data_pedido).toLocaleDateString('pt-BR')}</span>
                                    {(order.status === 'Entregue' || order.status === 'Entregue ao Aluno') && order.data_entrega && (
                                        <span className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-1 italic">Entregue em: {new Date(order.data_entrega).toLocaleDateString('pt-BR')}</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                                <div className="flex items-center justify-end gap-2 transition-opacity duration-300">
                                    {order.status === 'Enviado para Unidade' && (
                                        <button
                                            onClick={() => onUpdateStatus(order.id, 'Recebido na Unidade')}
                                            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all active:scale-95 shadow-sm font-bold text-[10px] uppercase tracking-wider"
                                        >
                                            Confirmar Recebimento
                                        </button>
                                    )}
                                    {order.status === 'Recebido na Unidade' && (
                                        <button
                                            onClick={() => onUpdateStatus(order.id, 'Entregue ao Aluno')}
                                            className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all active:scale-95 shadow-sm font-bold text-[10px] uppercase tracking-wider"
                                        >
                                            Entregar ao Aluno
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MaterialsTable({ materials }: { materials: any[] }) {
    if (materials.length === 0) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                <Package className="w-16 h-16 mb-6 opacity-20" />
                <p className="font-black text-xl text-center">Nenhum material<br />cadastrado</p>
            </div>
        );
    }

    return (
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {materials.map((material) => (
                <div key={material.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 flex flex-col group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center">
                        {material.imagem ? (
                            <img 
                                src={material.imagem} 
                                alt={material.nome}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <Package className="w-20 h-20 text-gray-200" />
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white">
                            <span className="font-black text-[#0E3A8C] text-sm tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(material.valor / 100)}
                            </span>
                        </div>
                    </div>
                    <div className="p-8 bg-white border-t border-gray-50 flex flex-col items-center justify-center text-center">
                        <h3 className="font-black text-[#0E3A8C] text-lg tracking-tight uppercase line-clamp-2">
                            {material.nome}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RegisterMaterialModal({ isOpen, onClose, onSuccess }: any) {
    const { profile } = useAuth();
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('materiais')
                .insert([{ nome, valor: 0 }]);

            if (error) throw error;
            onSuccess();
            onClose();
            setNome('');
        } catch (error) {
            console.error('Error registering material:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-white"
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
                                onClick={onClose}
                                className="absolute right-8 top-8 text-white/40 hover:text-white transition-colors z-[11]"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <div className="flex items-center gap-6 mb-2 relative z-10">
                                <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center shadow-inner backdrop-blur-sm">
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Novo Material</h3>
                                    <p className="text-blue-100/60 font-black text-[10px] uppercase tracking-[0.3em]">Ambiente de Gestão ELTI</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Nome do Material</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[24px] px-8 py-5 font-bold text-[#0E3A8C] focus:bg-white focus:border-[#0E3A8C]/10 focus:ring-4 focus:ring-[#0E3A8C]/5 transition-all outline-none"
                                    placeholder="Ex: Livro de Inglês B1"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-brand-red text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-red/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
