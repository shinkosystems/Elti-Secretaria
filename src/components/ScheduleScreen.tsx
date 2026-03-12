import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO,
  getDay,
  startOfDay,
  endOfDay,
  addWeeks,
  subWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

type ViewType = 'month' | 'week' | 'day';

interface Aula {
  id: string;
  fk_turma: string;
  turmas: { nome: string };
  dias_semana: string; // e.g., "Segunda, Quarta"
  horario_inicio: string;
  horario_fim: string;
}

interface Feriado {
  id: string;
  data: string;
  descricao: string;
}

export function ScheduleScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ data: format(new Date(), 'yyyy-MM-dd'), descricao: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*, turmas(nome)');
      
      const { data: feriadosData } = await supabase
        .from('feriados')
        .select('*');

      if (aulasData) setAulas(aulasData as any);
      if (feriadosData) setFeriados(feriadosData);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('feriados')
        .insert([newHoliday]);
      
      if (error) throw error;
      
      setIsHolidayModalOpen(false);
      setNewHoliday({ data: format(new Date(), 'yyyy-MM-dd'), descricao: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Erro ao cadastrar feriado');
    }
  };

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const subDays = (date: Date, amount: number) => addDays(date, -amount);

  const getClassesForDay = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: ptBR });
    
    // Check if it's a holiday
    const holiday = feriados.find(f => isSameDay(parseISO(f.data), date));
    if (holiday) return { holiday };

    // Filter classes that happen on this day of the week
    const dayClasses = aulas.filter(aula => {
      const days = aula.dias_semana.split(',').map(d => d.trim().toLowerCase());
      return days.includes(dayName.toLowerCase());
    });

    return { classes: dayClasses };
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#0E3A8C] tracking-tight">Horários de Aula</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-1 flex border border-gray-100">
            {(['month', 'week', 'day'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  view === v 
                    ? "bg-[#0E3A8C] text-white shadow-lg" 
                    : "text-gray-400 hover:text-[#0E3A8C]"
                )}
              >
                {v === 'month' ? 'Mensal' : v === 'week' ? 'Semanal' : 'Diário'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={prev} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0E3A8C] hover:bg-gray-50 transition-all border border-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-[#0E3A8C] hover:bg-gray-50 transition-all border border-gray-100">
              Hoje
            </button>
            <button onClick={next} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0E3A8C] hover:bg-gray-50 transition-all border border-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsHolidayModalOpen(true)}
            className="bg-brand-red text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-brand-red/20 flex items-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Feriado
          </button>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const { holiday, classes } = getClassesForDay(cloneDay);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] p-4 border-r border-b border-gray-50 transition-all flex flex-col gap-2",
              !isSameMonth(day, monthStart) ? "bg-gray-50/50" : "bg-white",
              isToday(day) && "bg-blue-50/30"
            )}
          >
            <span className={cn(
              "text-xs font-black",
              !isSameMonth(day, monthStart) ? "text-gray-300" : "text-gray-400",
              isToday(day) && "text-[#0E3A8C]"
            )}>
              {formattedDate}
            </span>
            
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
              {holiday ? (
                <div className="bg-red-50 text-red-600 p-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {holiday.descricao}
                </div>
              ) : (
                classes?.map((aula, idx) => (
                  <div key={idx} className="bg-blue-50 text-[#0E3A8C] p-1.5 rounded-lg text-[9px] font-black tracking-tight border border-blue-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="truncate">{aula.turmas?.nome}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-60">
                      <Clock className="w-2.5 h-2.5" />
                      {aula.horario_inicio} - {aula.horario_fim}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
        <div className="grid grid-cols-7 bg-[#F9FAFB] border-b border-gray-100">
          {dayNames.map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });

    return (
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
        <div className="grid grid-cols-7 bg-[#F9FAFB] border-b border-gray-100">
          {days.map(day => (
            <div key={day.toString()} className="py-6 text-center border-r border-gray-100 last:border-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                "text-xl font-black tracking-tight",
                isToday(day) ? "text-[#0E3A8C]" : "text-gray-600"
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {days.map(day => {
            const { holiday, classes } = getClassesForDay(day);
            return (
              <div key={day.toString()} className="p-4 border-r border-gray-50 last:border-0 flex flex-col gap-3">
                {holiday ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 text-center h-full">
                    <AlertCircle className="w-6 h-6" />
                    {holiday.descricao}
                  </div>
                ) : (
                  classes?.map((aula, idx) => (
                    <div key={idx} className="bg-blue-50 text-[#0E3A8C] p-4 rounded-2xl border border-blue-100 shadow-sm">
                      <p className="font-black text-xs uppercase tracking-widest mb-2">{aula.turmas?.nome}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold opacity-70">
                        <Clock className="w-3.5 h-3.5" />
                        {aula.horario_inicio} - {aula.horario_fim}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const { holiday, classes } = getClassesForDay(currentDate);

    return (
      <div className="bg-white rounded-[40px] shadow-2xl p-12 border border-white/50 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-2">
            {format(currentDate, 'EEEE, d MMMM', { locale: ptBR })}
          </p>
          <h3 className="text-4xl font-black text-[#0E3A8C] tracking-tight">Agenda do Dia</h3>
        </div>

        {holiday ? (
          <div className="bg-red-50 text-red-600 p-12 rounded-[40px] flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12" />
            <div>
              <p className="text-xl font-black uppercase tracking-widest mb-2">Feriado</p>
              <p className="font-bold opacity-80">{holiday.descricao}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {classes && classes.length > 0 ? (
              classes.map((aula, idx) => (
                <div key={idx} className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#0E3A8C] rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <CalendarIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-[#0E3A8C] tracking-tight mb-1">{aula.turmas?.nome}</p>
                      <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                        <Clock className="w-4 h-4" />
                        {aula.horario_inicio} - {aula.horario_fim}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-blue-100 text-[#0E3A8C] rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Em Aula
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Nenhuma aula programada para hoje.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#0E3A8C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {renderHeader()}
      
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Holiday Modal */}
      <AnimatePresence>
        {isHolidayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-[#0E3A8C]/20 backdrop-blur-md"
              onClick={() => setIsHolidayModalOpen(false)}
            />
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-white/50">
              <div className="p-8 bg-[#0E3A8C] text-white">
                <h3 className="text-2xl font-black tracking-tight">Cadastrar Feriado</h3>
                <p className="text-blue-100 font-bold opacity-80 text-sm">As aulas serão suspensas nesta data.</p>
              </div>
              <form onSubmit={handleAddHoliday} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Data do Feriado</label>
                  <input 
                    type="date" 
                    required
                    value={newHoliday.data}
                    onChange={(e) => setNewHoliday({ ...newHoliday, data: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-[#0E3A8C] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Descrição / Nome</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Independência do Brasil"
                    value={newHoliday.descricao}
                    onChange={(e) => setNewHoliday({ ...newHoliday, descricao: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-[#0E3A8C] outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsHolidayModalOpen(false)}
                    className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-brand-red text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-brand-red/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
