import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText 
} from 'lucide-react';

interface DashboardHomeProps {
  stats: any[];
  recentStudents: any[];
}

export function DashboardHome({ stats, recentStudents }: DashboardHomeProps) {
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
        {/* Recent Students Table */}
        <div className="lg:col-span-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#0E3A8C] tracking-tight">Alunos Recentes</h3>
            <button className="text-gray-300 hover:text-[#0E3A8C] transition-colors">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Aluno</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Curso</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F3F4F6]/50 transition-colors cursor-pointer">
                    <td className="px-8 py-6 font-bold text-[#0E3A8C]">{student.name}</td>
                    <td className="px-8 py-6 text-gray-500 font-medium">{student.course}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        student.status === 'Ativo' ? "bg-green-100 text-green-600" : 
                        student.status === 'Pendente' ? "bg-yellow-100 text-yellow-600" : 
                        "bg-red-100 text-red-600"
                      )}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-gray-400 text-xs font-bold uppercase tracking-tighter">{student.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 text-center border-t border-gray-50">
            <button className="text-[#0E3A8C] font-black text-xs uppercase tracking-widest hover:underline">Ver todos os alunos</button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-white/50">
          <h3 className="text-xl font-black text-[#0E3A8C] tracking-tight mb-8">Atividade Recente</h3>
          <div className="space-y-8">
            <ActivityItem 
              icon={CheckCircle} 
              color="text-green-500" 
              title="Matrícula Confirmada" 
              desc="Ana Silva completou a matrícula." 
              time="2 min atrás" 
            />
            <ActivityItem 
              icon={Clock} 
              color="text-blue-500" 
              title="Novo Horário" 
              desc="Turma B1 alterada para as 19h." 
              time="45 min atrás" 
            />
            <ActivityItem 
              icon={XCircle} 
              color="text-red-500" 
              title="Pagamento Atrasado" 
              desc="Bruno Costa possui pendência." 
              time="2 horas atrás" 
            />
            <ActivityItem 
              icon={FileText} 
              color="text-purple-500" 
              title="Documento Enviado" 
              desc="Carla Souza enviou o RG." 
              time="5 horas atrás" 
            />
          </div>
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
