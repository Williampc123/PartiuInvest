import type { CompoundInterestInput, CompoundInterestResult, MonthlyRecord, AnnualRecord } from './types';

/**
 * Calcula a evolução do patrimônio com juros compostos e aportes regulares.
 * 
 * Regra de conversão de taxa:
 * - Se taxa anual fornecida: i_m = (1 + i_a)^(1/12) - 1 (taxa equivalente composta)
 * - Se taxa mensal fornecida: i_m = i_m / 100
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const initialValue = Math.max(0, Number(input.initialValue) || 0);
  const monthlyValue = Math.max(0, Number(input.monthlyValue) || 0);
  const interestRate = Math.max(0, Number(input.interestRate) || 0);
  const period = Math.max(1, Math.floor(Number(input.period) || 1));
  const ratePeriod = input.ratePeriod || 'annual';
  const periodType = input.periodType || 'years';
  const contributionTiming = input.contributionTiming || 'end';

  // Determina quantidade total de meses
  const totalMonths = periodType === 'years' ? period * 12 : period;

  // Calcula taxa mensal equivalente decimal
  let monthlyRateDecimal = 0;
  let annualRateDecimal = 0;

  if (ratePeriod === 'annual') {
    annualRateDecimal = interestRate / 100;
    // Fórmula equivalente exata: (1 + i_a)^(1/12) - 1
    monthlyRateDecimal = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
  } else {
    monthlyRateDecimal = interestRate / 100;
    // Taxa anual equivalente: (1 + i_m)^12 - 1
    annualRateDecimal = Math.pow(1 + monthlyRateDecimal, 12) - 1;
  }

  let totalInvested = initialValue;
  let totalAccumulated = initialValue;
  let totalInterest = 0;
  let totalContributions = 0;

  const monthlyData: MonthlyRecord[] = [];
  const annualMap = new Map<number, { interest: number; contribution: number; lastRecord?: MonthlyRecord }>();

  for (let month = 1; month <= totalMonths; month++) {
    const year = Math.ceil(month / 12);
    const monthInYear = ((month - 1) % 12) + 1;
    let monthlyInterestEarned = 0;

    if (contributionTiming === 'start') {
      // Aporte no início do mês: rende juros no mesmo mês
      totalAccumulated += monthlyValue;
      totalInvested += monthlyValue;
      totalContributions += monthlyValue;

      monthlyInterestEarned = totalAccumulated * monthlyRateDecimal;
      totalAccumulated += monthlyInterestEarned;
      totalInterest += monthlyInterestEarned;
    } else {
      // Padrão (postecipado): juros sobre o saldo anterior, aporte somado ao final do mês
      monthlyInterestEarned = totalAccumulated * monthlyRateDecimal;
      totalAccumulated += monthlyInterestEarned;

      totalAccumulated += monthlyValue;
      totalInvested += monthlyValue;
      totalContributions += monthlyValue;

      totalInterest += monthlyInterestEarned;
    }

    const record: MonthlyRecord = {
      month,
      year,
      monthInYear,
      monthlyInterest: monthlyInterestEarned,
      monthlyContribution: monthlyValue,
      totalInvested,
      totalInterest,
      totalAccumulated,
    };

    monthlyData.push(record);

    // Agrupamento anual
    const currAnnual = annualMap.get(year) || { interest: 0, contribution: 0 };
    currAnnual.interest += monthlyInterestEarned;
    currAnnual.contribution += monthlyValue;
    currAnnual.lastRecord = record;
    annualMap.set(year, currAnnual);
  }

  const annualData: AnnualRecord[] = [];
  annualMap.forEach((val, yr) => {
    if (val.lastRecord) {
      annualData.push({
        year: yr,
        annualInterest: val.interest,
        annualContribution: val.contribution,
        totalInvested: val.lastRecord.totalInvested,
        totalInterest: val.lastRecord.totalInterest,
        totalAccumulated: val.lastRecord.totalAccumulated,
      });
    }
  });

  const netGainRatio = totalInvested > 0 ? (totalAccumulated / totalInvested) : 1;

  return {
    totalFinal: totalAccumulated,
    totalInvested,
    totalInterest,
    totalContributions,
    netGainRatio,
    totalMonths,
    monthlyRatePercent: monthlyRateDecimal * 100,
    annualRatePercent: annualRateDecimal * 100,
    monthlyData,
    annualData,
  };
}
