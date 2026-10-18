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
    <div className="space-y-6 text-navy">
      {/* Banner PRO */}
      <div className="rounded-2xl bg-gradient-to-r from-gold/15 via-white/80 to-white/90 border border-gold/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold-deep text-2xl font-black shrink-0">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-navy">Módulo Fiscal & Imposto de Renda (IRPF)</h3>
              <span className="rounded bg-gold px-1.5 py-0.2 text-[9px] font-black text-navy uppercase">PRO</span>
            </div>
            <p className="text-xs text-muted">Apuração automática de DARF mensal, isenção de R$ 20k e relatório anual de Bens e Direitos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTaxData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-navy/5 border border-navy/15 text-xs font-bold text-navy transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Recalcular Impostos
          </button>
        </div>
      </div>

      {/* Sub-abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-navy/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('darf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'darf'
              ? 'bg-navy text-white font-black shadow-sm'
              : 'text-muted hover:text-navy bg-navy/5'
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
              ? 'bg-navy text-white font-black shadow-sm'
              : 'text-muted hover:text-navy bg-navy/5'
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
            <div className="rounded-2xl bg-white/85 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)]">
              <span className="text-xs text-muted font-bold block">Total de Vendas em Ações no Mês</span>
              <div className="mt-2 text-2xl font-black text-navy">
                R$ {(currentMonthTax?.totalSalesStock || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ok">
                <CheckCircle className="h-4 w-4" />
                <span>Dentro do limite de isenção (&lt; R$ 20.000)</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/85 border border-white/95 p-5 shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)]">
              <span className="text-xs text-muted font-bold block">Lucro Líquido Tributável</span>
              <div className="mt-2 text-2xl font-black text-navy">
                R$ {((currentMonthTax?.stockProfit || 0) + (currentMonthTax?.fiiProfit || 0)).toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-muted">
                FIIs: R$ {(currentMonthTax?.fiiProfit || 0).toFixed(2)} (Alíquota 20%)
              </div>
            </div>

            <div className="rounded-2xl bg-white/85 border border-gold/40 p-5 bg-gradient-to-br from-gold/15 to-white shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.12)]">
              <span className="text-xs text-gold-deep font-bold block">DARF Previsto para Pagamento</span>
              <div className="mt-2 text-3xl font-black text-navy">
                R$ {(currentMonthTax?.totalDarfToPay || 0).toFixed(2)}
              </div>
              <div className="mt-2 text-[11px] text-muted">
                {currentMonthTax?.totalDarfToPay && currentMonthTax.totalDarfToPay > 0
                  ? 'Código da Receita: 6015 (Ganhos Líquidos em Bolsa)'
                  : 'Nenhum imposto a recolher neste mês ✅'}
              </div>
            </div>
          </div>

          {/* Regras Fiscais Resumidas */}
          <div className="p-4 rounded-2xl bg-white/85 border border-white/95 text-xs text-navy space-y-2 shadow-xs">
            <h4 className="font-bold text-navy flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gold-deep" />
              Regras Fiscais Automáticas Aplicadas:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-muted">
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
            <p className="text-xs text-muted font-medium">
              Copie e cole diretamente na ficha <b>Bens e Direitos</b> do programa IRPF da Receita Federal.
            </p>
          </div>

          <div className="rounded-2xl bg-white/85 border border-white/95 overflow-hidden shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(10,31,68,.10)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-navy whitespace-nowrap">
                <thead className="bg-slate-100/60 uppercase text-[10px] font-bold tracking-wider text-muted border-b border-navy/10">
                  <tr>
                    <th className="px-4 py-3">Grupo & Código</th>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Qtd</th>
                    <th className="px-4 py-3">Custo Médio</th>
                    <th className="px-4 py-3 font-black text-ok">Situação em 31/12 (Custo Total)</th>
                    <th className="px-4 py-3">Texto Discriminatório Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5 font-medium">
                  {taxData?.annualDeclaration.map((item) => (
                    <tr key={item.ticker} className="hover:bg-navy/[0.03] transition">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gold-deep block">{item.group}</span>
                        <span className="text-[11px] text-muted">{item.code}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-navy">{item.ticker}</td>
                      <td className="px-4 py-3 font-bold text-navy">{item.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-navy">R$ {item.averagePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 font-black text-ok">R$ {item.totalCost31Dec.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted text-[11px] max-w-md">{item.description}</td>
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
