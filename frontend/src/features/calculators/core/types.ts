export interface CompoundInterestInput {
  initialValue: number;
  monthlyValue: number;
  interestRate: number;
  ratePeriod: 'annual' | 'monthly';
  period: number;
  periodType: 'years' | 'months';
  contributionTiming?: 'end' | 'start';
}

export interface MonthlyRecord {
  month: number;
  year: number;
  monthInYear: number;
  monthlyInterest: number;
  monthlyContribution: number;
  totalInvested: number;
  totalInterest: number;
  totalAccumulated: number;
}

export interface AnnualRecord {
  year: number;
  annualInterest: number;
  annualContribution: number;
  totalInvested: number;
  totalInterest: number;
  totalAccumulated: number;
}

export interface CompoundInterestResult {
  totalFinal: number;
  totalInvested: number;
  totalInterest: number;
  totalContributions: number;
  netGainRatio: number; // Ex: 1.45 (rendeu 1.45x o valor investido)
  totalMonths: number;
  monthlyRatePercent: number;
  annualRatePercent: number;
  monthlyData: MonthlyRecord[];
  annualData: AnnualRecord[];
}
