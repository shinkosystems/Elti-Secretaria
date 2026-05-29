import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import {
  Users,
  MoreHorizontal,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  ArrowRight,
  XCircle,
  ClipboardList
} from 'lucide-react';

interface DashboardHomeProps {
  stats: any[];
  recentStudents: any[];
  recentOrders: any[];
  onNavigateToMaterials: () => void;
  onNavigateToFinance: () => void;
  onOpenPaymentModal: () => void;
}

export function DashboardHome({ stats, recentStudents, recentOrders, onNavigateToMaterials, onNavigateToFinance, onOpenPaymentModal }: DashboardHomeProps) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[40px] shadow-2xl p-8 flex flex-col gap-4 border border-white/50"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-[#0E3A8C] tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bento Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Status Table (Replaces Recent Students) */}
        <div className="lg:col-span-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[#0E3A8C] tracking-tight">Situação Financeira</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Mês de Referência: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenPaymentModal}
                className="bg-[#0E3A8C] text-white p-3 rounded-2xl hover:bg-[#0a2b66] transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2 group"
                title="Inserir Pagamento"
              >
                <DollarSign className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Inserir Pagamento</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto min-h-[300px] flex flex-col">
            {recentStudents.length > 0 ? (
              <table className="w-full text-left flex-1">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Aluno</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Turma</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Mensalidade</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Referência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#F3F4F6]/50 transition-colors cursor-pointer">
                      <td className="px-8 py-6 font-bold text-[#0E3A8C]">{student.name}</td>
                      <td className="px-8 py-6 text-gray-500 font-medium text-xs uppercase">{student.course}</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                          student.status === 'Pago' ? "bg-green-100 text-green-600" :
                            student.status === 'Pendente' ? "bg-yellow-100 text-yellow-600" :
                              "bg-red-100 text-red-600"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full",
                            student.status === 'Pago' ? "bg-green-500" :
                              student.status === 'Pendente' ? "bg-yellow-500 animate-pulse" :
                                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                          )} />
                          {student.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        {`${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-300">
                <DollarSign className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-black text-center text-sm leading-tight">Nenhum dado<br />financeiro</p>
              </div>
            )}
          </div>
          <div className="p-8 pt-0">
            <button
              onClick={onNavigateToFinance}
              className="w-full py-4 bg-gray-50 rounded-[20px] text-[#0E3A8C] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
            >
              Ver relatório financeiro completo
            </button>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-white/50 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-[#0E3A8C] tracking-tight">Pedidos Recentes</h3>
          </div>

          <div className="space-y-6 flex-1">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="group cursor-pointer" onClick={onNavigateToMaterials}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110",
                      order.status === 'Entregue' ? "bg-green-50 text-green-500" :
                        order.status === 'Negado' ? "bg-red-50 text-red-500" :
                          order.status === 'Em Processamento' ? "bg-blue-50 text-blue-500" :
                            "bg-yellow-50 text-yellow-500"
                    )}>
                      {order.status === 'Entregue' ? <CheckCircle className="w-5 h-5" /> :
                        order.status === 'Negado' ? <XCircle className="w-5 h-5" /> :
                          order.status === 'Em Processamento' ? <Clock className="w-5 h-5" /> :
                            <ClipboardList className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#0E3A8C] text-sm leading-tight tracking-tight truncate group-hover:text-brand-red transition-colors">{order.title}</p>
                      <p className="text-gray-500 text-[10px] font-bold mt-0.5 truncate uppercase tracking-widest">{order.user}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          order.status === 'Entregue' ? "bg-green-50 text-green-600 border-green-100" :
                            order.status === 'Negado' ? "bg-red-50 text-red-600 border-red-100" :
                              order.status === 'Em Processamento' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                "bg-yellow-50 text-yellow-600 border-yellow-100"
                        )}>
                          {order.status || 'Pedido Feito'}
                        </span>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] italic">{order.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-black text-center text-sm leading-tight">Nenhum pedido<br />recente</p>
              </div>
            )}
          </div>

          <button
            onClick={onNavigateToMaterials}
            className="mt-8 w-full py-4 bg-gray-50 rounded-[20px] text-[#0E3A8C] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
          >
            Ver Todos os Pedidos
          </button>
        </div>
      </div>
    </>
  );
}

function ActivityItem({ icon: Icon, color, title, desc, time }: { icon: any, color: string, title: string, desc: string, time: string }) {
  return (
    <div className="flex gap-4">
      <div className={cn("w-10 h-10 rounded-2xl bg-[#F3F4F6] flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-black text-[#0E3A8C] text-sm leading-tight tracking-tight">{title}</p>
        <p className="text-gray-500 text-xs font-bold mt-1">{desc}</p>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-2">{time}</p>
      </div>
    </div>
  );
}
