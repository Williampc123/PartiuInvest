import React, { useState } from 'react';
import { CompoundInterestResult } from '../../core/types';
import { Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CompoundInterestTableProps {
  result: CompoundInterestResult;
}

export const CompoundInterestTable: React.FC<CompoundInterestTableProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'annual' | 'monthly'>('annual');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24; // 2 anos por página na visão mensal

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalPages = Math.ceil(result.monthlyData.length / pageSize);
  const paginatedMonthly = result.monthlyData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportXLSX = () => {
    // Exportação completa
    const rows = result.monthlyData.map((m) => ({
      Mês: m.month,
      Ano: m.year,
      'Aporte Mensal (R$)': m.monthlyContribution,
      'Juros no Mês (R$)': Number(m.monthlyInterest.toFixed(2)),
      'Total Investido (R$)': Number(m.totalInvested.toFixed(2)),
      'Juros Acumulados (R$)': Number(m.totalInterest.toFixed(2)),
      'Patrimônio Acumulado (R$)': Number(m.totalAccumulated.toFixed(2)),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Juros Compostos');
    XLSX.writeFile(wb, 'partiu-invest-juros-compostos.xlsx');
  };

  return (
    <div className="card space-y-4">
      {/* Topo da Tabela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/20 text-gold-deep">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="card-title text-navy">Tabela de Evolução Detalhada</h3>
            <p className="card-sub text-xs text-muted">Acompanhe a geração de juros e o saldo acumulado</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Visualização */}
          <div className="inline-flex rounded-xl bg-navy/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('annual')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'annual'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Anual ({result.annualData.length} {result.annualData.length === 1 ? 'ano' : 'anos'})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('monthly');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'monthly'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Mensal ({result.monthlyData.length} meses)
            </button>
          </div>

          {/* Botão Exportar Excel */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className="btn-line text-xs h-[34px] px-3 gap-1.5 hover:bg-gold/10 hover:border-gold/50"
            title="Baixar planilha Excel completa"
          >
            <Download className="h-3.5 w-3.5 text-gold-deep" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white/70">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-navy/10 bg-navy/5 text-navy font-bold">
              <th className="p-3 text-left">{activeTab === 'annual' ? 'Ano' : 'Mês / Ano'}</th>
              <th className="p-3 text-right">Aportes Período</th>
              <th className="p-3 text-right">Juros do Período</th>
              <th className="p-3 text-right">Total Investido</th>
              <th className="p-3 text-right">Juros Acumulados</th>
              <th className="p-3 text-right font-extrabold text-navy">Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {activeTab === 'annual' ? (
              result.annualData.map((row) => (
                <tr key={row.year} className="hover:bg-gold/5 transition font-medium">
                  <td className="p-3 font-bold text-navy">Ano {row.year}</td>
                  <td className="p-3 text-right text-muted">{formatCurrency(row.annualContribution)}</td>
                  <td className="p-3 text-right font-semibold text-emerald-600">
                    +{formatCurrency(row.annualInterest)}
                  </td>
                  <td className="p-3 text-right text-muted">{formatCurrency(row.totalInvested)}</td>
                  <td className="p-3 text-right text-emerald-700 font-semibold">
                    {formatCurrency(row.totalInterest)}
                  </td>
                  <td className="p-3 text-right font-extrabold text-navy text-[13px]">
                    {formatCurrency(row.totalAccumulated)}
                  </td>
                </tr>
              ))
            ) : (
              paginatedMonthly.map((row) => (
                <tr key={row.month} className="hover:bg-gold/5 transition font-medium">
                  <td className="p-3 font-semibold text-navy">
                    Mês {row.month} <span className="text-[10px] text-muted font-normal">(Ano {row.year})</span>
                  </td>
                  <td className="p-3 text-right text-muted">{formatCurrency(row.monthlyContribution)}</td>
                  <td className="p-3 text-right font-semibold text-emerald-600">
                    +{formatCurrency(row.monthlyInterest)}
                  </td>
                  <td className="p-3 text-right text-muted">{formatCurrency(row.totalInvested)}</td>
                  <td className="p-3 text-right text-emerald-700 font-semibold">
                    {formatCurrency(row.totalInterest)}
                  </td>
                  <td className="p-3 text-right font-extrabold text-navy text-[13px]">
                    {formatCurrency(row.totalAccumulated)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação para visão mensal */}
      {activeTab === 'monthly' && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted">
          <span>
            Mostrando meses {(currentPage - 1) * pageSize + 1} a{' '}
            {Math.min(currentPage * pageSize, result.monthlyData.length)} de{' '}
            {result.monthlyData.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="grid h-7 w-7 place-items-center rounded-lg border border-navy/10 bg-white text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-navy px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="grid h-7 w-7 place-items-center rounded-lg border border-navy/10 bg-white text-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy/5"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
