import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Shield,
  UserCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

export function UsersScreen() {
  const [filter, setFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    turmas: 0
  });

  const filterOptions = [
    'Todos',
    'Alunos',
    'Professores',
    'Gerentes',
    'Supervisores',
    'Sem categoria'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const { count: studentCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('tipousuario', 'Student');
      const { count: teacherCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('tipousuario', 'Teacher');
      const { count: turmasCount } = await supabase.from('turmas').select('*', { count: 'exact', head: true }).eq('ativo', true);

      setCounts({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        turmas: turmasCount || 0
      });

      // Fetch users
      const { data: userData } = await supabase
        .from('users')
        .select(`
          id, 
          nome, 
          email, 
          tipousuario, 
          created_at,
          turmas:fk_turma (nome)
        `)
        .order('nome');

      if (userData) {
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === 'Todos') return matchesSearch;
    if (filter === 'Alunos') return matchesSearch && user.tipousuario === 'Student';
    if (filter === 'Professores') return matchesSearch && user.tipousuario === 'Teacher';
    if (filter === 'Gerentes') return matchesSearch && user.tipousuario === 'Manager';
    if (filter === 'Supervisores') return matchesSearch && user.tipousuario === 'Supervisor';
    if (filter === 'Sem categoria') return matchesSearch && (!user.tipousuario || user.tipousuario === '');
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Users} 
          label="Alunos" 
          value={counts.students} 
          color="text-blue-500" 
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={GraduationCap} 
          label="Professores" 
          value={counts.teachers} 
          color="text-green-500" 
          bgColor="bg-green-50"
        />
        <StatCard 
          icon={BookOpen} 
          label="Turmas" 
          value={counts.turmas} 
          color="text-purple-500" 
          bgColor="bg-purple-50"
        />
      </div>

      {/* Users List Card */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h3 className="text-2xl font-black text-[#0E3A8C] flex items-center gap-3">
              Gestão de Usuários
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                {filteredUsers.length} total
              </span>
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl py-3 pl-10 pr-6 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64 transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                {filterOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                      filter === opt 
                        ? "bg-[#0E3A8C] text-white shadow-lg shadow-blue-900/20" 
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-bold">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Turma</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Cadastro</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#0E3A8C] font-black shadow-sm">
                          {user.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-[#0E3A8C] text-sm">{user.nome}</div>
                          <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email || 'Sem email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                        user.tipousuario === 'Student' ? "bg-blue-50 text-blue-600" :
                        user.tipousuario === 'Teacher' ? "bg-green-50 text-green-600" :
                        user.tipousuario === 'Manager' ? "bg-purple-50 text-purple-600" :
                        user.tipousuario === 'Supervisor' ? "bg-orange-50 text-orange-600" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {user.tipousuario || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold text-gray-500">
                        {user.turmas?.nome || '—'}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button className="p-2 hover:bg-white rounded-xl transition-all text-gray-300 hover:text-[#0E3A8C] shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-gray-300">
              <UserCircle className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-black text-xl">Nenhum usuário encontrado</p>
              <p className="font-bold text-sm">Tente ajustar seus filtros ou busca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-white/50 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", bgColor)}>
        <Icon className={cn("w-8 h-8", color)} />
      </div>
      <div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-3xl font-black text-[#0E3A8C] tracking-tighter">{value}</div>
      </div>
    </div>
  );
}
