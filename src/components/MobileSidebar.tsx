import React from 'react';
import { cn } from '../lib/utils';
import {
  TrendingUp,
  Users,
  Calendar,
  FileText,
  LogOut,
  X,
  ChevronRight,
  Coins,
  Package,
  CreditCard,
  BookOpen
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  onLogout: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  activeScreen,
  setActiveScreen,
  onLogout
}: MobileSidebarProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-500 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#0E3A8C] z-[70] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden flex flex-col shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '24px 24px' }}></div>

        {/* Header */}
        <div className="relative p-8 flex items-center justify-between border-b border-white/10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">ELTI</h1>
            <span className="text-[8px] font-black text-brand-red uppercase tracking-[0.3em] mt-1">Secretaria</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2 relative z-10">
          <MobileNavItem
            icon={TrendingUp}
            label="Início"
            active={activeScreen === 'inicio'}
            onClick={() => { setActiveScreen('inicio'); onClose(); }}
          />
          <MobileNavItem
            icon={Users}
            label="Usuários"
            active={activeScreen === 'usuarios'}
            onClick={() => { setActiveScreen('usuarios'); onClose(); }}
          />
          <MobileNavItem
            icon={Calendar}
            label="Horários"
            active={activeScreen === 'horarios'}
            onClick={() => { setActiveScreen('horarios'); onClose(); }}
          />
          <MobileNavItem
            icon={BookOpen}
            label="Turmas"
            active={activeScreen === 'turmas'}
            onClick={() => { setActiveScreen('turmas'); onClose(); }}
          />
          <MobileNavItem
            icon={Coins}
            label="ELTI Coins"
            active={activeScreen === 'coins'}
            onClick={() => { setActiveScreen('coins'); onClose(); }}
          />
          <MobileNavItem
            icon={Package}
            label="Materiais"
            active={activeScreen === 'materiais'}
            onClick={() => { setActiveScreen('materiais'); onClose(); }}
          />
          <MobileNavItem
            icon={CreditCard}
            label="Financeiro"
            active={activeScreen === 'financeiro'}
            onClick={() => { setActiveScreen('financeiro'); onClose(); }}
          />
        </nav>

        {/* Footer */}
        <div className="p-8 border-t border-white/10 relative z-10">
          <button
            onClick={onLogout}
            className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl text-white/60 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all",
        active
          ? "bg-white text-[#0E3A8C] shadow-xl shadow-black/20"
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5" />
        {label}
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />}
    </button>
  );
}
