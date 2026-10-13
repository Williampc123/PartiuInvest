/**
 * taxCalculationEngine.ts
 * Motor de apuração tributária de investimentos conforme a legislação brasileira (Receita Federal / B3)
 */

export interface TradeTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  type: 'STOCK' | 'FII' | 'CRYPTO' | 'BDR' | 'ETF';
  operation: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fees?: number; // Corretagem, emolumentos B3
  isDayTrade?: boolean;
}

export interface MonthlyTaxResult {
  yearMonth: string;
  totalSalesStock: number;
  stockProfit: number;
  stockTax: number;
  isStockExempt: boolean;
  fiiProfit: number;
  fiiTax: number;
  cryptoSales: number;
  cryptoProfit: number;
  cryptoTax: number;
  dayTradeProfit: number;
  dayTradeTax: number;
  totalDarfToPay: number;
  accumulatedLosses: {
    stockSwing: number;
    dayTrade: number;
    fii: number;
    crypto: number;
  };
}

export interface AnnualDeclarationItem {
  code: string; // Ex: 31 para Ações, 73 para FIIs, 01/02 para Cripto
  group: string; // Ex: "03 - Participações Societárias", "07 - Fundos"
  ticker: string;
  name: string;
  cnpj?: string;
  quantity: number;
  averagePrice: number;
  totalCost31Dec: number;
  description: string;
}

export function calculateMonthlyTaxes(
  transactions: TradeTransaction[],
  previousLosses = { stockSwing: 0, dayTrade: 0, fii: 0, crypto: 0 }
): MonthlyTaxResult[] {
  // Ordena transações cronologicamente
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Rastreamento de Posição & Preço Médio
  const positions: Record<string, { quantity: number; totalCost: number; averagePrice: number; type: string }> = {};

  // Agrupamento por mês (YYYY-MM)
  const monthsMap = new Map<string, TradeTransaction[]>();
  sorted.forEach((t) => {
    const ym = t.date.slice(0, 7);
    if (!monthsMap.has(ym)) monthsMap.set(ym, []);
    monthsMap.get(ym)!.push(t);
  });

  const results: MonthlyTaxResult[] = [];
  let lossStockSwing = previousLosses.stockSwing;
  let lossDayTrade = previousLosses.dayTrade;
  let lossFii = previousLosses.fii;
  let lossCrypto = previousLosses.crypto;

  for (const [ym, monthTrades] of monthsMap.entries()) {
    let monthStockSales = 0;
    let monthStockProfit = 0;
    let monthFiiProfit = 0;
    let monthCryptoSales = 0;
    let monthCryptoProfit = 0;
    let monthDayTradeProfit = 0;

    for (const trade of monthTrades) {
      const { ticker, type, operation, quantity, price, fees = 0, isDayTrade = false } = trade;
      const totalAmount = quantity * price;

      if (!positions[ticker]) {
        positions[ticker] = { quantity: 0, totalCost: 0, averagePrice: 0, type };
      }
      const pos = positions[ticker];

      if (operation === 'BUY') {
        pos.quantity += quantity;
        pos.totalCost += totalAmount + fees;
        pos.averagePrice = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
      } else if (operation === 'SELL') {
        const costBasis = pos.averagePrice * quantity;
        const netSale = totalAmount - fees;
        const profitOrLoss = netSale - costBasis;

        pos.quantity = Math.max(0, pos.quantity - quantity);
        pos.totalCost = pos.quantity * pos.averagePrice;

        if (isDayTrade) {
          monthDayTradeProfit += profitOrLoss;
        } else if (type === 'STOCK') {
          monthStockSales += totalAmount;
          monthStockProfit += profitOrLoss;
        } else if (type === 'FII') {
          monthFiiProfit += profitOrLoss;
        } else if (type === 'CRYPTO') {
          monthCryptoSales += totalAmount;
          monthCryptoProfit += profitOrLoss;
        }
      }
    }

    // Aplicação das regras de isenção e tributação
    // 1. Ações Swing Trade
    let stockTax = 0;
    const isStockExempt = monthStockSales <= 20000;
    if (monthStockProfit > 0) {
      if (!isStockExempt) {
        let taxableStock = monthStockProfit;
        if (lossStockSwing > 0) {
          const used = Math.min(taxableStock, lossStockSwing);
          taxableStock -= used;
          lossStockSwing -= used;
        }
        stockTax = taxableStock * 0.15; // 15%
      }
    } else if (monthStockProfit < 0) {
      lossStockSwing += Math.abs(monthStockProfit);
    }

    // 2. FIIs (sempre 20% sobre lucro líquido)
    let fiiTax = 0;
    if (monthFiiProfit > 0) {
      let taxableFii = monthFiiProfit;
      if (lossFii > 0) {
        const used = Math.min(taxableFii, lossFii);
        taxableFii -= used;
        lossFii -= used;
      }
      fiiTax = taxableFii * 0.20;
    } else if (monthFiiProfit < 0) {
      lossFii += Math.abs(monthFiiProfit);
    }

    // 3. Criptomoedas (15% se vendas > R$ 35.000)
    let cryptoTax = 0;
    if (monthCryptoSales > 35000 && monthCryptoProfit > 0) {
      let taxableCrypto = monthCryptoProfit;
      if (lossCrypto > 0) {
        const used = Math.min(taxableCrypto, lossCrypto);
        taxableCrypto -= used;
        lossCrypto -= used;
      }
      cryptoTax = taxableCrypto * 0.15;
    } else if (monthCryptoProfit < 0) {
      lossCrypto += Math.abs(monthCryptoProfit);
    }

    // 4. Day Trade (20% sem isenção)
    let dayTradeTax = 0;
    if (monthDayTradeProfit > 0) {
      let taxableDT = monthDayTradeProfit;
      if (lossDayTrade > 0) {
        const used = Math.min(taxableDT, lossDayTrade);
        taxableDT -= used;
        lossDayTrade -= used;
      }
      dayTradeTax = taxableDT * 0.20;
    } else if (monthDayTradeProfit < 0) {
      lossDayTrade += Math.abs(monthDayTradeProfit);
    }

    const totalDarfToPay = stockTax + fiiTax + cryptoTax + dayTradeTax;

    results.push({
      yearMonth: ym,
      totalSalesStock: parseFloat(monthStockSales.toFixed(2)),
      stockProfit: parseFloat(monthStockProfit.toFixed(2)),
      stockTax: parseFloat(stockTax.toFixed(2)),
      isStockExempt,
      fiiProfit: parseFloat(monthFiiProfit.toFixed(2)),
      fiiTax: parseFloat(fiiTax.toFixed(2)),
      cryptoSales: parseFloat(monthCryptoSales.toFixed(2)),
      cryptoProfit: parseFloat(monthCryptoProfit.toFixed(2)),
      cryptoTax: parseFloat(cryptoTax.toFixed(2)),
      dayTradeProfit: parseFloat(monthDayTradeProfit.toFixed(2)),
      dayTradeTax: parseFloat(dayTradeTax.toFixed(2)),
      totalDarfToPay: parseFloat(totalDarfToPay.toFixed(2)),
      accumulatedLosses: {
        stockSwing: parseFloat(lossStockSwing.toFixed(2)),
        dayTrade: parseFloat(lossDayTrade.toFixed(2)),
        fii: parseFloat(lossFii.toFixed(2)),
        crypto: parseFloat(lossCrypto.toFixed(2)),
      },
    });
  }

  return results;
}

export function generateAnnualDeclaration(transactions: TradeTransaction[]): AnnualDeclarationItem[] {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const positions: Record<string, { quantity: number; totalCost: number; averagePrice: number; type: string }> = {};

  for (const trade of sorted) {
    const { ticker, type, operation, quantity, price, fees = 0 } = trade;
    if (!positions[ticker]) {
      positions[ticker] = { quantity: 0, totalCost: 0, averagePrice: 0, type };
    }
    const pos = positions[ticker];

    if (operation === 'BUY') {
      pos.quantity += quantity;
      pos.totalCost += quantity * price + fees;
      pos.averagePrice = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
    } else if (operation === 'SELL') {
      pos.quantity = Math.max(0, pos.quantity - quantity);
      pos.totalCost = pos.quantity * pos.averagePrice;
    }
  }

  const items: AnnualDeclarationItem[] = [];

  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;

    let group = '03 - Participações Societárias';
    let code = '01 - Ações (inclusive as listadas em bolsa)';

    if (pos.type === 'FII') {
      group = '07 - Fundos';
      code = '03 - Fundos de Investimento Imobiliário (FII)';
    } else if (pos.type === 'CRYPTO') {
      group = '08 - Criptoativos';
      code = '01 - Criptomoeda (Bitcoin / Altcoins)';
    } else if (pos.type === 'BDR') {
      group = '04 - Aplicações e Investimentos';
      code = '04 - Ativos negociados no exterior / BDRs';
    }

    items.push({
      group,
      code,
      ticker,
      name: ticker,
      quantity: pos.quantity,
      averagePrice: parseFloat(pos.averagePrice.toFixed(4)),
      totalCost31Dec: parseFloat(pos.totalCost.toFixed(2)),
      description: `${pos.quantity} cotas/ações de ${ticker} custodiadas na corretora. Custo médio unitário de aquisição: R$ ${pos.averagePrice.toFixed(2)}. Custo total: R$ ${pos.totalCost.toFixed(2)}.`,
    });
  }

  return items;
}
