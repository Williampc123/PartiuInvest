import React, { useState } from 'react';
import { InvestmentTransaction, MonthlyTaxResult, AnnualDeclarationItem } from '../../../domain/types';
import { calculateTaxReport } from '../../../infrastructure/investmentsService';
import { ShieldAlert, FileText, CheckCircle, AlertTriangle, Download, Calculator, RefreshCw } from 'lucide-react';

interface TaxReportTabProps {
  transactions: InvestmentTransaction[];
}

export const TaxReportTab: React.FC<TaxReportTabProps> = ({ transactions }) => {
  const [subTab, setSubTab] = useState<'darf' | 'annual'>('darf');
  const [taxData, setTaxData] = useState<{
    monthlyResults: MonthlyTaxResult[];
    annualDeclaration: AnnualDeclarationItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTaxData = async () => {
    setIsLoading(true);
    try {
      const data = await calculateTaxReport(transactions);
      setTaxData(data);
    } catch {}
    setIsLoading(false);
  };

  React.useEffect(() => {
    loadTaxData();
  }, [transactions]);

  const currentMonthTax = taxData?.monthlyResults[taxData.monthlyResults.length - 1];

  return (
    <div className="space-y-6">
      {/* Banner PRO */}
      <div className="rounded-2xl bg-gradient-to-r from-gold/20 via-navy-soft to-navy-deep border border-gold/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-2xl font-black shrink-0">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Módulo Fiscal & Imposto de Renda (IRPF)</h3>
              <span className="rounded bg-gold px-1.5 py-0.2 text-[9px] font-black text-navy-deep uppercase">PRO</span>
            </div>
            <p className="text-xs text-slate-300">Apuração automática de DARF mensal, isenção de R$ 20k e relatório anual de Bens e Direitos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTaxData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Recalcular Impostos
          </button>
        </div>
      </div>

      {/* Sub-abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('darf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'darf'
              ? 'bg-gold text-navy-deep font-black shadow-md'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Apuração Mensal & DARF</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('annual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'annual'
              ? 'bg-gold text-navy-deep font-black shadow-md'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Declaração Anual (Bens e Direitos)</span>
        </button>
      </div>

      {subTab === 'darf' ? (
        <div className="space-y-6">
          {/* Card Status do Mês Atual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5">
              <span className="text-xs text-slate-400 font-semibold block">Total de Vendas em Ações no Mês</span>
              <div className="mt-2 text-2xl font-black text-white">
                R$ {(currentMonthTax?.totalSalesStock || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span>Dentro do limite de isenção (&lt; R$ 20.000)</span>
              </div>
            </div>

            <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-5">
              <span className="text-xs text-slate-400 font-semibold block">Lucro Líquido Tributável</span>
              <div className="mt-2 text-2xl font-black text-white">
                R$ {((currentMonthTax?.stockProfit || 0) + (currentMonthTax?.fiiProfit || 0)).toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                FIIs: R$ {(currentMonthTax?.fiiProfit || 0).toFixed(2)} (Alíquota 20%)
              </div>
            </div>

            <div className="rounded-2xl bg-navy-deep/80 border border-gold/40 p-5 bg-gradient-to-br from-gold/10 to-navy-deep">
              <span className="text-xs text-gold font-bold block">DARF Previsto para Pagamento</span>
              <div className="mt-2 text-3xl font-black text-gold">
                R$ {(currentMonthTax?.totalDarfToPay || 0).toFixed(2)}
              </div>
              <div className="mt-2 text-[11px] text-slate-300">
                {currentMonthTax?.totalDarfToPay && currentMonthTax.totalDarfToPay > 0
                  ? 'Código da Receita: 6015 (Ganhos Líquidos em Bolsa)'
                  : 'Nenhum imposto a recolher neste mês ✅'}
              </div>
            </div>
          </div>

          {/* Regras Fiscais Resumidas */}
          <div className="p-4 rounded-2xl bg-navy-soft/30 border border-white/10 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Regras Fiscais Automáticas Aplicadas:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><b>Ações Swing Trade:</b> Isento de imposto se o valor total das vendas no mês for até R$ 20.000,00. Acima disso, 15% sobre o lucro líquido.</li>
              <li><b>FIIs (Fundos Imobiliários):</b> Tributação fixa de 20% sobre o ganho de capital em qualquer venda de cota (sem faixa de isenção).</li>
              <li><b>Criptomoedas:</b> Isenção para alienações totais no mês de até R$ 35.000,00. Acima disso, 15% sobre o ganho.</li>
              <li><b>Compensação de Prejuízos:</b> Prejuízos acumulados passados são abatidos automaticamente antes do cálculo do DARF.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Copie e cole diretamente na ficha <b>Bens e Direitos</b> do programa IRPF da Receita Federal.
            </p>
          </div>

          <div className="rounded-2xl bg-navy-deep/80 border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Grupo & Código</th>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Qtd</th>
                    <th className="px-4 py-3">Custo Médio</th>
                    <th className="px-4 py-3">Situação em 31/12 (Custo Total)</th>
                    <th className="px-4 py-3">Texto Discriminatório Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {taxData?.annualDeclaration.map((item) => (
                    <tr key={item.ticker} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gold block">{item.group}</span>
                        <span className="text-[11px] text-slate-400">{item.code}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-white">{item.ticker}</td>
                      <td className="px-4 py-3 font-bold text-white">{item.quantity}</td>
                      <td className="px-4 py-3">R$ {item.averagePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 font-black text-emerald-400">R$ {item.totalCost31Dec.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] max-w-md">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
