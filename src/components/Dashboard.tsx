import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  LogOut,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Loader2,
  Coins,
  Package,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

import { DashboardHome } from './DashboardHome';
import { ScheduleScreen } from './ScheduleScreen';
import { MobileSidebar } from './MobileSidebar';
import { UsersScreen } from './UsersScreen';
import { EltiCoinsScreen } from './EltiCoinsScreen';
import { MaterialsScreen } from './MaterialsScreen';
import { FinanceScreen } from './FinanceScreen';
import { TurmasScreen } from './TurmasScreen';
import { RegistrationModal } from './RegistrationModal';
import { NewPaymentModal } from './NewPaymentModal';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeScreen, setActiveScreen] = useState('inicio');
  const [stats, setStats] = useState([
    { label: 'Alunos Ativos', value: '...', icon: Users, color: 'bg-blue-500' },
    { label: 'Matrículas', value: '...', icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Turmas Ativas', value: '...', icon: Calendar, color: 'bg-purple-500' },
    { label: 'Pendências', value: '...', icon: FileText, color: 'bg-red-500' },
  ]);

  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (profile?.fk_colegio) {
      fetchDashboardData();
    } else if (profile) {
      // Profile exists but no colegio - stop data loading
      setDataLoading(false);
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile?.fk_colegio) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      // 1. Fetch Total Students
      const { count: studentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .contains('tipousuario', ['Student'])
        .eq('fk_colegio', profile.fk_colegio);

      // 2. Fetch New Registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newRegCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .contains('tipousuario', ['Student'])
        .eq('fk_colegio', profile.fk_colegio)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 3. Fetch Active Turmas
      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .eq('fk_colegio', profile.fk_colegio);

      // 4. Fetch Pendencies (Inactive students as proxy)
      const { count: pendingCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .contains('tipousuario', ['Student'])
        .eq('isAdmin', false)
        .eq('fk_colegio', profile.fk_colegio)
        .filter('fk_turma', 'is', null);

      setStats([
        { label: 'Alunos Ativos', value: (studentCount || 0).toString(), icon: Users, color: 'bg-blue-500' },
        { label: 'Novos Alunos', value: (newRegCount || 0).toString(), icon: GraduationCap, color: 'bg-green-500' },
        { label: 'Turmas Ativas', value: (turmasCount || 0).toString(), icon: Calendar, color: 'bg-purple-500' },
        { label: 'Sem Turma', value: (pendingCount || 0).toString(), icon: FileText, color: 'bg-red-500' },
      ]);

      // 5. Fetch Recent Students with current month tuition status
      const now = new Date();
      const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      const { data: students } = await supabase
        .from('users')
        .select(`
          id, 
          uuid,
          nome, 
          created_at,
          tipousuario,
          turmas:fk_turma (nome),
          mensalidades (
            status,
            mes_referencia
          )
        `)
        .contains('tipousuario', ['Student'])
        .eq('fk_colegio', profile.fk_colegio)
        .order('created_at', { ascending: false })
        .limit(5);

      if (students) {
        setRecentStudents(students.map(s => {
          // Get the status for the current month, or 'Pendente'
          const currentMensalidade = (s as any).mensalidades?.find((m: any) => m.mes_referencia === currentMonth);

          return {
            id: s.id,
            name: s.nome,
            course: (s as any).turmas?.nome || 'Não Atribuído',
            status: currentMensalidade?.status || 'Pendente',
            date: new Date(s.created_at).toLocaleDateString('pt-BR')
          };
        }));
      }

      // 6. Fetch Recent Orders
      const { data: orders } = await supabase
        .from('pedidos_materiais')
        .select(`
          id,
          item_nome,
          status,
          data_pedido,
          users:fk_usuario (nome)
        `)
        .eq('fk_colegio', profile.fk_colegio)
        .order('data_pedido', { ascending: false })
        .limit(4);

      if (orders) {
        setRecentOrders(orders.map(o => ({
          id: o.id,
          title: o.item_nome,
          user: (o as any).users?.nome || 'Usuário',
          status: o.status || 'Pedido Feito',
          time: new Date(o.data_pedido).toLocaleDateString('pt-BR')
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  if (dataLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#0E3A8C] animate-spin" />
          <p className="text-[#0E3A8C] font-black uppercase tracking-widest text-[10px]">Carregando Painel...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl p-12 text-center border border-white/50 max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-[#0E3A8C] mb-2">Perfil não encontrado</h3>
          <p className="text-gray-400 font-bold mb-8">Não conseguimos localizar seu registro de usuário no sistema. Entre em contato com o suporte.</p>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn-primary w-full"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sair e Tentar Novamente'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col font-sans relative overflow-x-hidden">
      {/* Header Section */}
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-[#0E3A8C] rounded-b-[60px] z-0 shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '24px 24px' }}></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Sidebar Component */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          onLogout={handleLogout}
        />

        {/* Desktop Sidebar - Sticky & Integrated */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 transition-all duration-500 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
          {/* Top Section (Logo) - Transparent to show global blue background */}
          <div className="h-[30vh] flex flex-col items-center justify-center text-center relative">
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-5xl font-black text-white tracking-tighter leading-none drop-shadow-2xl mb-2">ELTI</h1>
              <div className="bg-brand-red text-white text-[9px] font-black px-4 py-1.5 rounded-full tracking-[0.3em] uppercase shadow-xl shadow-brand-red/40 inline-block">
                Secretaria
              </div>
            </div>
          </div>

          {/* Bottom Section (Navigation) - Transparent, following page background */}
          <div className="flex-1 p-8 pt-4 flex flex-col">
            <nav className="space-y-4">
              <NavItem
                icon={TrendingUp}
                label="Início"
                active={activeScreen === 'inicio'}
                onClick={() => setActiveScreen('inicio')}
              />
              <NavItem
                icon={Users}
                label="Usuários"
                active={activeScreen === 'usuarios'}
                onClick={() => setActiveScreen('usuarios')}
              />
              <NavItem
                icon={Calendar}
                label="Horários"
                active={activeScreen === 'horarios'}
                onClick={() => setActiveScreen('horarios')}
              />
              <NavItem
                icon={BookOpen}
                label="Turmas"
                active={activeScreen === 'turmas'}
                onClick={() => setActiveScreen('turmas')}
              />
              <NavItem
                icon={Coins}
                label="ELTI Coins"
                active={activeScreen === 'coins'}
                onClick={() => setActiveScreen('coins')}
              />
              <NavItem
                icon={Package}
                label="Materiais"
                active={activeScreen === 'materiais'}
                onClick={() => setActiveScreen('materiais')}
              />
              <NavItem
                icon={CreditCard}
                label="Financeiro"
                active={activeScreen === 'financeiro'}
                onClick={() => setActiveScreen('financeiro')}
              />
            </nav>

            <div className="mt-auto pt-8 border-t border-gray-200/50">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 p-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-[#0E3A8C] transition-colors w-full disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {isLoggingOut ? 'Saindo...' : 'Sair do Sistema'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-4 px-6 lg:pt-8 lg:px-12 w-full min-w-0 overflow-x-hidden">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm text-white shrink-0"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">Bem-vindo, {profile?.nome?.split(' ')[0] || 'Admin'}</h2>
                <p className="text-blue-100 font-bold opacity-80 text-sm sm:text-base">Gerencie sua secretaria com facilidade.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="bg-brand-red text-white font-black py-4 px-6 rounded-full shadow-lg shadow-brand-red/20 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">Nova Matrícula</span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          {activeScreen === 'inicio' && (
            <DashboardHome
              stats={stats}
              recentStudents={recentStudents}
              recentOrders={recentOrders}
              onNavigateToMaterials={() => setActiveScreen('materiais')}
              onNavigateToFinance={() => setActiveScreen('financeiro')}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            />
          )}
          {activeScreen === 'horarios' && <ScheduleScreen />}
          {activeScreen === 'turmas' && <TurmasScreen />}
          {activeScreen === 'usuarios' && <UsersScreen />}
          {activeScreen === 'coins' && <EltiCoinsScreen />}
          {activeScreen === 'materiais' && <MaterialsScreen />}
          {activeScreen === 'financeiro' && <FinanceScreen onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />}
        </main>

        <RegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          fk_colegio={profile?.fk_colegio}
        />
        <NewPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          fk_colegio={profile?.fk_colegio}
          onSuccess={fetchDashboardData}
        />
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all w-full text-left",
        active
          ? "bg-[#0E3A8C] text-white shadow-xl shadow-blue-900/20"
          : "text-gray-400 hover:text-[#0E3A8C] hover:bg-gray-50"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
