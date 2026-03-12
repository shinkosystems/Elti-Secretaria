import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  LogOut, 
  Search,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

import { DashboardHome } from './DashboardHome';
import { ScheduleScreen } from './ScheduleScreen';
import { MobileSidebar } from './MobileSidebar';
import { UsersScreen } from './UsersScreen';

export function Dashboard() {
  const [activeScreen, setActiveScreen] = useState('inicio');
  const [stats, setStats] = useState([
    { label: 'Alunos Ativos', value: '...', icon: Users, color: 'bg-blue-500' },
    { label: 'Matrículas', value: '...', icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Turmas Ativas', value: '...', icon: Calendar, color: 'bg-purple-500' },
    { label: 'Pendências', value: '...', icon: FileText, color: 'bg-red-500' },
  ]);

  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Total Students
      const { count: studentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tipousuario', 'Student');

      // 2. Fetch New Registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newRegCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tipousuario', 'Student')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 3. Fetch Active Turmas
      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // 4. Fetch Pendencies (Inactive students as proxy)
      const { count: pendingCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tipousuario', 'Student')
        .eq('isAdmin', false) // Just a guess for pendency
        .filter('fk_turma', 'is', null); // Students without a class

      setStats([
        { label: 'Alunos Ativos', value: (studentCount || 0).toString(), icon: Users, color: 'bg-blue-500' },
        { label: 'Novos Alunos', value: (newRegCount || 0).toString(), icon: GraduationCap, color: 'bg-green-500' },
        { label: 'Turmas Ativas', value: (turmasCount || 0).toString(), icon: Calendar, color: 'bg-purple-500' },
        { label: 'Sem Turma', value: (pendingCount || 0).toString(), icon: FileText, color: 'bg-red-500' },
      ]);

      // 5. Fetch Recent Students
      const { data: students } = await supabase
        .from('users')
        .select(`
          id, 
          nome, 
          created_at,
          tipousuario,
          turmas:fk_turma (nome)
        `)
        .eq('tipousuario', 'Student')
        .order('created_at', { ascending: false })
        .limit(5);

      if (students) {
        setRecentStudents(students.map(s => ({
          id: s.id,
          name: s.nome,
          course: (s as any).turmas?.nome || 'Não Atribuído',
          status: (s as any).turmas ? 'Ativo' : 'Pendente',
          date: new Date(s.created_at).toLocaleDateString('pt-BR')
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0E3A8C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col font-sans relative overflow-x-hidden">
      {/* Header Section */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[#0E3A8C] rounded-b-[60px] z-0 shadow-xl overflow-hidden">
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

        {/* Desktop Sidebar - Transparent & Integrated */}
        <aside className="hidden lg:flex flex-col w-80 fixed inset-y-0 left-0 z-50 transition-all duration-500">
          {/* Top Section (Logo) - Transparent to show global blue background */}
          <div className="h-[40vh] flex flex-col items-center justify-center text-center relative">
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-5xl font-black text-white tracking-tighter leading-none drop-shadow-2xl mb-2">ELTI</h1>
              <div className="bg-brand-red text-white text-[9px] font-black px-4 py-1.5 rounded-full tracking-[0.3em] uppercase shadow-xl shadow-brand-red/40 inline-block">
                Secretaria
              </div>
            </div>
          </div>

          {/* Bottom Section (Navigation) - Transparent, following page background */}
          <div className="flex-1 p-8 flex flex-col">
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
                icon={FileText} 
                label="Documentos" 
                active={activeScreen === 'documentos'} 
                onClick={() => setActiveScreen('documentos')}
              />
            </nav>

            <div className="mt-auto pt-8 border-t border-gray-200/50">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-[#0E3A8C] transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto w-full lg:ml-80">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm text-white shrink-0"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">Bem-vindo, Admin</h2>
                <p className="text-blue-100 font-bold opacity-80 text-sm sm:text-base">Gerencie sua secretaria com facilidade.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar aluno..." 
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full py-4 pl-12 pr-6 text-white font-bold placeholder:text-white/30 outline-none w-full md:w-64 focus:bg-white/20 transition-all"
                />
              </div>
              <button className="bg-brand-red text-white font-black py-4 px-6 rounded-full shadow-lg shadow-brand-red/20 flex items-center gap-2 active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">Nova Matrícula</span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          {activeScreen === 'inicio' && <DashboardHome stats={stats} recentStudents={recentStudents} />}
          {activeScreen === 'horarios' && <ScheduleScreen />}
          {activeScreen === 'usuarios' && <UsersScreen />}
          {activeScreen === 'documentos' && (
            <div className="bg-white rounded-[40px] shadow-2xl p-12 text-center border border-white/50">
              <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-[#0E3A8C]">Documentos</h3>
              <p className="text-gray-400 font-bold">Módulo em desenvolvimento.</p>
            </div>
          )}
        </main>
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
