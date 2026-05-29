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
  User,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { UserSettingsModal } from './UserSettingsModal';

export function UsersScreen() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<any>({
    students: 0,
    teachers: 0,
    turmas: 0,
    Managers: 0,
    Supervisors: 0,
    uncategorized: 0,
    Total: 0
  });


  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const filterOptions = [
    'Todos',
    'Alunos',
    'Professores',
    'Gerentes',
    'Supervisores',
    'Sem categoria'
  ];

  useEffect(() => {
    if (profile?.fk_colegio) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.fk_colegio) return;

    setLoading(true);
    try {
      // Fetch turmas count separately
      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .eq('fk_colegio', profile.fk_colegio);

      // Fetch users
      const { data: userData } = await supabase
        .from('users')
        .select(`
          id, 
          nome, 
          email, 
          tipousuario, 
          foto,
          created_at,
          idbooks,
          fk_turma,
          turmas:fk_turma (nome)
        `)
        .eq('fk_colegio', profile.fk_colegio)
        .order('nome');

      if (userData) {
        setUsers(userData);

        // Calculate category counts from fetched users
        const newCounts: any = {
          students: userData.filter(u => hasRole(u.tipousuario, 'Student')).length,
          teachers: userData.filter(u => hasRole(u.tipousuario, 'Teacher')).length,
          Managers: userData.filter(u => hasRole(u.tipousuario, 'Manager')).length,
          Supervisors: userData.filter(u => hasRole(u.tipousuario, 'Supervisor')).length,
          uncategorized: userData.filter(u => !u.tipousuario || (Array.isArray(u.tipousuario) && u.tipousuario.length === 0)).length,
          Total: userData.length,
          turmas: turmasCount || 0
        };
        setCounts(newCounts);
      }

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (tipousuario: any, targetRole: string) => {
    if (!tipousuario) return false;
    const roles = Array.isArray(tipousuario) ? tipousuario : [tipousuario];
    return roles.some(r =>
      typeof r === 'string' &&
      (r === targetRole || r.split(',').map((s: string) => s.trim()).includes(targetRole))
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (filter === 'Todos') return matchesSearch;
    if (filter === 'Alunos') return matchesSearch && hasRole(user.tipousuario, 'Student');
    if (filter === 'Professores') return matchesSearch && hasRole(user.tipousuario, 'Teacher');
    if (filter === 'Gerentes') return matchesSearch && hasRole(user.tipousuario, 'Manager');
    if (filter === 'Supervisores') return matchesSearch && hasRole(user.tipousuario, 'Supervisor');
    if (filter === 'Sem categoria') return matchesSearch && (!user.tipousuario || (Array.isArray(user.tipousuario) && user.tipousuario.length === 0));

    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
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
        <div className="p-8 space-y-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-[#0E3A8C] flex items-center gap-3">
              Gestão de Usuários
            </h3>
          </div>

          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none w-full transition-all"
              />
            </div>

          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar max-w-full">
            {filterOptions.map((opt) => {
              const countKey = opt === 'Todos' ? 'Total' :
                opt === 'Alunos' ? 'students' :
                  opt === 'Professores' ? 'teachers' :
                    opt === 'Gerentes' ? 'Managers' :
                      opt === 'Supervisores' ? 'Supervisors' : 'uncategorized';
              const count = counts[countKey];

              return (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={cn(
                    "whitespace-nowrap px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                    filter === opt
                      ? "bg-[#0E3A8C] text-white shadow-xl shadow-blue-900/20"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {opt}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[8px] font-black",
                    filter === opt ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#0E3A8C] font-black shadow-sm overflow-hidden text-sm uppercase">
                          {user.foto ? (
                            <img src={user.foto} alt={user.nome || 'Usuário'} className="w-full h-full object-cover" />
                          ) : (
                            (user.nome || 'U').charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-black text-[#0E3A8C] text-sm">{user.nome || 'Sem Nome'}</div>
                          <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email || 'Sem email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(user.tipousuario) && user.tipousuario.length > 0 ? (
                          user.tipousuario.map((role: string) => (
                            <span key={role} className={cn(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider whitespace-nowrap",
                              role === 'Student' ? "bg-blue-50 text-blue-600" :
                                role === 'Teacher' ? "bg-green-50 text-green-600" :
                                  role === 'Manager' ? "bg-purple-50 text-purple-600" :
                                    role === 'Supervisor' ? "bg-orange-50 text-orange-600" :
                                      "bg-gray-100 text-gray-500"
                            )}>
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase tracking-wider">
                            Sem categoria
                          </span>
                        )}
                      </div>
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
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsSettingsModalOpen(true);
                        }}
                        className="p-2 hover:bg-[#0E3A8C]/5 rounded-xl transition-all text-[#0E3A8C] flex items-center gap-2 font-black text-[10px] uppercase tracking-wider mx-auto lg:ml-auto"
                      >
                        {hasRole(user.tipousuario, 'Student') ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        Configurar
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

      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={selectedUser}
        fk_colegio={profile?.fk_colegio || null}
        onSuccess={fetchData}
      />
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
