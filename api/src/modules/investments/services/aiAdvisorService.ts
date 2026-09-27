/**
 * aiAdvisorService.ts
 * Motor de Inteligência Artificial para diagnóstico avançado de carteiras,
 * análise de risco, exposição setorial e sugestões de rebalanceamento personalizado.
 */

export interface PortfolioAssetSummary {
  ticker: string;
  type: 'STOCK' | 'FII' | 'CRYPTO' | 'BDR' | 'ETF' | 'FIXED_INCOME';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  percentage: number;
  targetPercentage?: number;
  sector?: string;
  dy?: number;
}

export interface AIAnalysisResult {
  score: number; // 0 a 100
  rating: 'Excelente' | 'Boa' | 'Moderada' | 'Arriscada' | 'Desbalanceada';
  summary: string;
  strengths: string[];
  risks: string[];
  rebalanceSuggestions: Array<{
    ticker: string;
    action: 'BUY' | 'HOLD' | 'REDUCE';
    recommendedAmountBrl: number;
    reason: string;
  }>;
  sectorAllocation: Record<string, number>;
  passiveIncomeForecast: {
    monthlyAverageEstimated: number;
    annualYieldEstimated: number;
  };
}

export async function generateAIAdvisorDiagnosis(
  assets: PortfolioAssetSummary[],
  totalPortfolioValue: number,
  targetAllocation?: { stocks: number; fiis: number; crypto: number; fixedIncome: number }
): Promise<AIAnalysisResult> {
  if (!assets || assets.length === 0) {
    return {
      score: 50,
      rating: 'Moderada',
      summary: 'Sua carteira ainda não possui ativos suficientes para um diagnóstico aprofundado.',
      strengths: ['Carteira limpa pronta para receber os primeiros aportes estruturados.'],
      risks: ['Falta de histórico e posições cadastradas.'],
      rebalanceSuggestions: [],
      sectorAllocation: {},
      passiveIncomeForecast: { monthlyAverageEstimated: 0, annualYieldEstimated: 0 },
    };
  }

  // 1. Agrupamento por tipo e setor
  const typeAllocation: Record<string, number> = {};
  const sectorAllocation: Record<string, number> = {};
  let totalEstimatedAnnualDividends = 0;

  for (const asset of assets) {
    const val = asset.totalValue || asset.quantity * (asset.currentPrice || asset.averagePrice);
    const pct = totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;

    typeAllocation[asset.type] = (typeAllocation[asset.type] || 0) + pct;
    const sector = asset.sector || 'Outros';
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + pct;

    if (asset.dy && asset.dy > 0) {
      totalEstimatedAnnualDividends += val * (asset.dy / 100);
    }
  }

  // 2. Cálculo do Score de Diversificação e Saúde Financeira
  let score = 85;
  const strengths: string[] = [];
  const risks: string[] = [];
  const rebalanceSuggestions: AIAnalysisResult['rebalanceSuggestions'] = [];

  // Verificação de Concentração em Ativo Único (> 25% penaliza)
  const maxConcentratedAsset = assets.reduce((max, a) => (a.percentage > max.percentage ? a : max), assets[0]);
  if (maxConcentratedAsset && maxConcentratedAsset.percentage > 25) {
    score -= 15;
    risks.push(`Alta concentração no ativo ${maxConcentratedAsset.ticker} (${maxConcentratedAsset.percentage.toFixed(1)}% do total). O ideal é manter abaixo de 15% por ativo individual.`);
  } else {
    strengths.push('Boa dispersão por ativo individual, sem dependência excessiva de uma única empresa.');
  }

  // Verificação de Exposição em Cripto (> 20% é considerado arrojado)
  const cryptoPct = typeAllocation['CRYPTO'] || 0;
  if (cryptoPct > 20) {
    risks.push(`Exposição elevada em criptoativos (${cryptoPct.toFixed(1)}%), o que aumenta a volatilidade geral da carteira.`);
    score -= 10;
  } else if (cryptoPct > 0) {
    strengths.push(`Exposição equilibrada em criptoativos (${cryptoPct.toFixed(1)}%), conferindo assimetria positiva sem risco desmedido.`);
  }

  // Verificação de Fundos Imobiliários e Renda Passiva
  const fiiPct = typeAllocation['FII'] || 0;
  if (fiiPct >= 20) {
    strengths.push(`Excelente alocação em Fundos Imobiliários (${fiiPct.toFixed(1)}%), gerando fluxo recorrente e previsível de renda passiva mensal isenta de IR.`);
  }

  // 3. Sugestões de Rebalanceamento
  const defaultTargets = targetAllocation || { stocks: 40, fiis: 35, crypto: 10, fixedIncome: 15 };
  
  if (fiiPct < defaultTargets.fiis - 10) {
    rebalanceSuggestions.push({
      ticker: 'HGLG11 / MXRF11',
      action: 'BUY',
      recommendedAmountBrl: totalPortfolioValue * 0.1,
      reason: 'Aumentar a fatia de Fundos Imobiliários para fortalecer a geração de proventos mensais.',
    });
  }

  if (maxConcentratedAsset && maxConcentratedAsset.percentage > 30) {
    rebalanceSuggestions.push({
      ticker: maxConcentratedAsset.ticker,
      action: 'HOLD',
      recommendedAmountBrl: 0,
      reason: `Interromper novos aportes em ${maxConcentratedAsset.ticker} até que os demais ativos alcancem equilíbrio proporcional.`,
    });
  }

  // Determinação do Rating
  let rating: AIAnalysisResult['rating'] = 'Boa';
  if (score >= 90) rating = 'Excelente';
  else if (score >= 75) rating = 'Boa';
  else if (score >= 60) rating = 'Moderada';
  else rating = 'Arriscada';

  const monthlyAverageEstimated = totalEstimatedAnnualDividends / 12;
  const annualYieldEstimated = totalPortfolioValue > 0 ? (totalEstimatedAnnualDividends / totalPortfolioValue) * 100 : 0;

  const summary = `Diagnóstico IA: Sua carteira possui classificação **${rating}** (Score ${score}/100). Com ${assets.length} ativos cadastrados, a projeção estimada de renda passiva é de aproximadamente **R$ ${monthlyAverageEstimated.toFixed(2)}/mês** (Yield Médio de ${annualYieldEstimated.toFixed(1)}% a.a.).`;

  return {
    score: Math.max(20, Math.min(100, score)),
    rating,
    summary,
    strengths,
    risks,
    rebalanceSuggestions,
    sectorAllocation,
    passiveIncomeForecast: {
      monthlyAverageEstimated: parseFloat(monthlyAverageEstimated.toFixed(2)),
      annualYieldEstimated: parseFloat(annualYieldEstimated.toFixed(2)),
    },
  };
}
