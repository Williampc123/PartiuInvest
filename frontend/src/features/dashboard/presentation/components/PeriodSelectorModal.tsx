import React, { useState } from 'react';
import {
  X,
  Calendar,
  CalendarRange,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/features/auth/useAppStore';
import { PeriodFilter } from '@/core/dateUtils';

interface PeriodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PeriodSelectorModal: React.FC<PeriodSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { periodFilter, setPeriodFilter, setCustomPeriod, setSelectedYearMonth } = useAppStore();

  const [activeTab, setActiveTab] = useState<'month' | 'custom' | 'presets'>(
    periodFilter.type === 'custom' ? 'custom' : 'month'
  );

  // Estado para aba Mês
  const initialYear = periodFilter.yearMonth
    ? parseInt(periodFilter.yearMonth.split('-')[0], 10)
    : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  // Estado para aba Personalizado
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayStr = `${todayStr.slice(0, 7)}-01`;
  const [startDate, setStartDate] = useState(periodFilter.startDate || firstDayStr);
  const [endDate, setEndDate] = useState(periodFilter.endDate || todayStr);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthsList = [
    { num: '01', name: 'Jan', fullName: 'Janeiro' },
    { num: '02', name: 'Fev', fullName: 'Fevereiro' },
    { num: '03', name: 'Mar', fullName: 'Março' },
    { num: '04', name: 'Abr', fullName: 'Abril' },
    { num: '05', name: 'Mai', fullName: 'Maio' },
    { num: '06', name: 'Jun', fullName: 'Junho' },
    { num: '07', name: 'Jul', fullName: 'Julho' },
    { num: '08', name: 'Ago', fullName: 'Agosto' },
    { num: '09', name: 'Set', fullName: 'Setembro' },
    { num: '10', name: 'Out', fullName: 'Outubro' },
    { num: '11', name: 'Nov', fullName: 'Novembro' },
    { num: '12', name: 'Dez', fullName: 'Dezembro' },
  ];

  const handleSelectMonth = (monthNum: string) => {
    const ym = `${selectedYear}-${monthNum}`;
    setSelectedYearMonth(ym);
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg('Informe a data inicial e a data final.');
      return;
    }
    if (startDate > endDate) {
      setErrorMsg('A data inicial não pode ser posterior à data final.');
      return;
    }
    setErrorMsg(null);
    setCustomPeriod(startDate, endDate);
    onClose();
  };

  const handleSelectPreset = (presetKey: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;

    switch (presetKey) {
      case 'this_month': {
        const ym = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
        setSelectedYearMonth(ym);
        break;
      }
      case 'last_month': {
        let prevM = currentMonthNum - 1;
        let prevY = currentYear;
        if (prevM < 1) {
          prevM = 12;
          prevY -= 1;
        }
        const ym = `${prevY}-${String(prevM).padStart(2, '0')}`;
        setSelectedYearMonth(ym);
        break;
      }
      case 'last_3_months': {
        const startD = new Date(currentYear, currentMonthNum - 3, 1);
        const endD = new Date(currentYear, currentMonthNum, 0);
        const sStr = startD.toISOString().split('T')[0];
        const eStr = endD.toISOString().split('T')[0];
        setPeriodFilter({
          type: 'custom',
          startDate: sStr,
          endDate: eStr,
          label: 'Últimos 3 Meses',
        });
        break;
      }
      case 'last_6_months': {
        const startD = new Date(currentYear, currentMonthNum - 6, 1);
        const endD = new Date(currentYear, currentMonthNum, 0);
        const sStr = startD.toISOString().split('T')[0];
        const eStr = endD.toISOString().split('T')[0];
        setPeriodFilter({
          type: 'custom',
          startDate: sStr,
          endDate: eStr,
          label: 'Últimos 6 Meses',
        });
        break;
      }
      case 'this_year': {
        setPeriodFilter({
          type: 'custom',
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-12-31`,
          label: `Ano de ${currentYear}`,
        });
        break;
      }
      case 'all': {
        setPeriodFilter({
          type: 'all',
          label: 'Todo o Período',
        });
        break;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-md bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold-deep" />
              Selecionar Período
            </h3>
            <p className="text-xs text-muted">
              Filtre os dados do sistema por mês, atalhos rápidos ou período personalizado.
            </p>
          </div>

          {/* Abas */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-navy/5 border border-navy/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`py-2 px-2 rounded-xl transition ${
                activeTab === 'month'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Mês a Mês
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`py-2 px-2 rounded-xl transition ${
                activeTab === 'presets'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Atalhos Rápidos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-2 rounded-xl transition ${
                activeTab === 'custom'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* ABA 1: MÊS A MÊS */}
          {activeTab === 'month' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Seletor de Ano */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-navy/5 border border-navy/10">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="icon-btn"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-extrabold text-navy text-sm">{selectedYear}</span>
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="icon-btn"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Grid de 12 Meses */}
              <div className="grid grid-cols-3 gap-2">
                {monthsList.map((m) => {
                  const ym = `${selectedYear}-${m.num}`;
                  const isSelected =
                    periodFilter.type === 'month' && periodFilter.yearMonth === ym;

                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => handleSelectMonth(m.num)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition text-xs font-semibold ${
                        isSelected
                          ? 'bg-navy text-white border-navy shadow-md font-bold'
                          : 'bg-white/80 border-navy/10 text-navy hover:bg-navy/5'
                      }`}
                    >
                      <span className="block">{m.fullName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: ATALHOS RÁPIDOS */}
          {activeTab === 'presets' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              {[
                { key: 'this_month', label: 'Este Mês (Atual)', desc: 'Mês corrente' },
                { key: 'last_month', label: 'Mês Anterior', desc: 'Mês passado completo' },
                { key: 'last_3_months', label: 'Últimos 3 Meses', desc: 'Trimestre consolidado' },
                { key: 'last_6_months', label: 'Últimos 6 Meses', desc: 'Semestre consolidado' },
                { key: 'this_year', label: `Ano Atual (${new Date().getFullYear()})`, desc: 'Todos os meses do ano' },
                { key: 'all', label: 'Todo o Histórico', desc: 'Todos os dados cadastrados' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className="w-full p-3 rounded-xl border border-navy/10 bg-white/80 hover:bg-navy/5 text-left flex items-center justify-between transition group"
                >
                  <div>
                    <span className="text-xs font-bold text-navy block group-hover:text-gold-deep transition">
                      {p.label}
                    </span>
                    <small className="text-[10px] text-muted">{p.desc}</small>
                  </div>
                  <Sparkles className="h-4 w-4 text-muted group-hover:text-gold-deep transition" />
                </button>
              ))}
            </div>
          )}

          {/* ABA 3: PERÍODO PERSONALIZADO */}
          {activeTab === 'custom' && (
            <form onSubmit={handleApplyCustom} className="space-y-3.5 animate-in fade-in duration-150">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                    <CalendarRange className="h-3.5 w-3.5 text-gold-deep" /> Data Inicial
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1 flex items-center gap-1">
                    <CalendarRange className="h-3.5 w-3.5 text-gold-deep" /> Data Final
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-navy/15 bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-navy/5 border border-navy/10 text-[11px] text-muted space-y-1">
                <span className="font-bold text-navy block">💡 Visão Consolidada:</span>
                <p>
                  Todas as receitas, despesas, boletos e gráficos serão consolidados com base no intervalo de datas selecionado.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-gold text-xs h-11 justify-center shadow-md font-bold gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Aplicar Período Personalizado</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
