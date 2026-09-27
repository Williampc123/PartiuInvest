"use strict";
/**
 * b3FileParserService.ts
 * Parser inteligente de planilhas e extratos de negociação exportados da Área do Investidor da B3 (.xlsx, .xls, .csv)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseB3FileBuffer = parseB3FileBuffer;
exports.parseB3Rows = parseB3Rows;
const XLSX = __importStar(require("xlsx"));
function normalizeDate(val) {
    if (!val)
        return '';
    const str = String(val).trim();
    if (str === '-' || str === '--')
        return '';
    // Formato DD/MM/YYYY
    if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [d, m, y] = str.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Formato YYYY-MM-DD
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return str;
    }
    // Formato numérico serial do Excel (ex: 45392)
    if (typeof val === 'number' || !isNaN(Number(str))) {
        const num = Number(val);
        if (num > 30000 && num < 60000) {
            const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
            return dateObj.toISOString().split('T')[0];
        }
    }
    return '';
}
function parseNumber(val) {
    if (val === null || val === undefined || val === '' || val === '-')
        return 0;
    if (typeof val === 'number')
        return isNaN(val) ? 0 : val;
    let str = String(val).replace('R$', '').replace(/\s/g, '').trim();
    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}
function cleanTickerSymbol(raw) {
    let ticker = String(raw || '').trim().toUpperCase();
    // Se for mercado fracionário de ação terminado em F (ex: PETR4F, BBDC3F, TAEE11F), remove o 'F' final
    if (ticker.endsWith('F') && ticker.length >= 5 && ticker.length <= 7) {
        const base = ticker.slice(0, -1);
        if (base.match(/^[A-Z]{4}\d{1,2}$/)) {
            ticker = base;
        }
    }
    return ticker;
}
function detectAssetType(ticker) {
    if (ticker.startsWith('WIN') || ticker.startsWith('WDO') || ticker.startsWith('IND') || ticker.startsWith('DOL')) {
        return 'OTHER';
    }
    if (ticker.endsWith('34') || ticker.endsWith('35')) {
        return 'BDR';
    }
    if (ticker.endsWith('11')) {
        const isStockUnit = ['TAEE11', 'KLBN11', 'SAPR11', 'ALUP11', 'ENGI11', 'SANB11', 'BPAC11', 'SULA11'].includes(ticker);
        if (isStockUnit)
            return 'STOCK';
        const isEtf = ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'SPXI11', 'XINA11', 'GOLD11', 'MATB11'].includes(ticker);
        if (isEtf)
            return 'ETF';
        return 'FII';
    }
    return 'STOCK';
}
function parseB3FileBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('Nenhuma planilha encontrada no arquivo enviado.');
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!jsonData || jsonData.length === 0) {
        return [];
    }
    return parseB3Rows(jsonData);
}
function parseB3Rows(rows) {
    const transactions = [];
    let headerIndex = -1;
    let isResumoFormat = false;
    // Localiza a linha do cabeçalho
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
        const rowStr = rows[i].map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowStr.includes('código de negociação') && (rowStr.includes('quantidade (compra)') || rowStr.includes('preço médio'))) {
            headerIndex = i;
            isResumoFormat = true;
            break;
        }
        if ((rowStr.includes('código') || rowStr.includes('ativo') || rowStr.includes('papel')) &&
            (rowStr.includes('data') || rowStr.includes('movimentação') || rowStr.includes('instituição') || rowStr.includes('c/v'))) {
            headerIndex = i;
            break;
        }
    }
    const startRow = headerIndex >= 0 ? headerIndex + 1 : 1;
    const headers = headerIndex >= 0 ? rows[headerIndex].map((h) => String(h || '').trim().toLowerCase()) : [];
    // Mapeamento de índices de colunas
    const colTicker = headers.findIndex((h) => h.includes('código') || h.includes('ativo') || h.includes('papel'));
    const colDateStart = headers.findIndex((h) => h.includes('inicial') || h.includes('data do negócio') || h.includes('data'));
    const colDateEnd = headers.findIndex((h) => h.includes('final') || h.includes('vencimento'));
    const colBroker = headers.findIndex((h) => h.includes('instituição') || h.includes('corretora'));
    const colQtyBuy = headers.findIndex((h) => h.includes('quantidade (compra)') || (h.includes('compra') && h.includes('qtd')));
    const colQtySell = headers.findIndex((h) => h.includes('quantidade (venda)') || (h.includes('venda') && h.includes('qtd')));
    const colPriceBuy = headers.findIndex((h) => h.includes('preço médio (compra)') || (h.includes('preço') && h.includes('compra')));
    const colPriceSell = headers.findIndex((h) => h.includes('preço médio (venda)') || (h.includes('preço') && h.includes('venda')));
    // Colunas para formato detalhado
    const colMovType = headers.findIndex((h) => h.includes('movimentação') || h.includes('c/v') || h.includes('tipo'));
    const colQty = headers.findIndex((h) => h === 'quantidade' || (h.includes('quantidade') && !h.includes('compra') && !h.includes('venda') && !h.includes('líquida')));
    const colPrice = headers.findIndex((h) => h === 'preço' || h.includes('preço unitário') || (h.includes('preço') && !h.includes('médio')));
    for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2)
            continue;
        const rowStr = row.join(' ').trim();
        if (!rowStr || rowStr.toLowerCase().startsWith('total'))
            continue;
        // 1. Formato "Resumo de Negociação" (negociacao-resumo-*.xlsx / .csv)
        if (isResumoFormat || (colQtyBuy >= 0 && colPriceBuy >= 0)) {
            const rawTicker = String(row[colTicker >= 0 ? colTicker : 0] || '').trim();
            if (!rawTicker)
                continue;
            const ticker = cleanTickerSymbol(rawTicker);
            const broker = String(row[colBroker >= 0 ? colBroker : 3] || 'B3 / Corretora').trim();
            const dateStart = normalizeDate(row[colDateStart >= 0 ? colDateStart : 1]) || new Date().toISOString().split('T')[0];
            const dateEnd = normalizeDate(row[colDateEnd >= 0 ? colDateEnd : 2]) || dateStart;
            const qtyBuy = parseNumber(row[colQtyBuy >= 0 ? colQtyBuy : 4]);
            const qtySell = parseNumber(row[colQtySell >= 0 ? colQtySell : 5]);
            const priceBuy = parseNumber(row[colPriceBuy >= 0 ? colPriceBuy : 7]);
            const priceSell = parseNumber(row[colPriceSell >= 0 ? colPriceSell : 8]);
            const assetType = detectAssetType(ticker);
            // Se teve compra
            if (qtyBuy > 0 && priceBuy > 0) {
                transactions.push({
                    id: `b3_${Date.now()}_${i}_buy`,
                    date: dateStart,
                    ticker,
                    type: assetType,
                    operation: 'BUY',
                    quantity: qtyBuy,
                    price: priceBuy,
                    total: Number((qtyBuy * priceBuy).toFixed(2)),
                    broker,
                });
            }
            // Se teve venda
            if (qtySell > 0 && priceSell > 0) {
                transactions.push({
                    id: `b3_${Date.now()}_${i}_sell`,
                    date: dateEnd,
                    ticker,
                    type: assetType,
                    operation: 'SELL',
                    quantity: qtySell,
                    price: priceSell,
                    total: Number((qtySell * priceSell).toFixed(2)),
                    broker,
                });
            }
            continue;
        }
        // 2. Formato Detalhado / Transação a Transação
        let dateStr = '';
        let opStr = 'BUY';
        let ticker = '';
        let quantity = 0;
        let price = 0;
        let broker = 'B3 / Corretora';
        if (colDateStart >= 0)
            dateStr = normalizeDate(row[colDateStart]);
        if (colTicker >= 0)
            ticker = cleanTickerSymbol(String(row[colTicker] || ''));
        if (colBroker >= 0)
            broker = String(row[colBroker] || 'B3 / Corretora').trim();
        if (colMovType >= 0) {
            const mov = String(row[colMovType] || '').toLowerCase();
            if (mov.includes('venda') || mov === 'v')
                opStr = 'SELL';
            else
                opStr = 'BUY';
        }
        if (colQty >= 0)
            quantity = parseNumber(row[colQty]);
        if (colPrice >= 0)
            price = parseNumber(row[colPrice]);
        // Fallback inteligente varrendo colunas caso colunas dinâmicas não estejam indexadas
        if (!ticker || quantity === 0) {
            for (let c = 0; c < row.length; c++) {
                const val = String(row[c] || '').trim();
                if (!dateStr && (val.match(/^\d{2}\/\d{2}\/\d{4}$/) || val.match(/^\d{4}-\d{2}-\d{2}$/))) {
                    dateStr = normalizeDate(val);
                }
                if (val.toLowerCase() === 'compra' || val.toLowerCase() === 'c')
                    opStr = 'BUY';
                if (val.toLowerCase() === 'venda' || val.toLowerCase() === 'v')
                    opStr = 'SELL';
                const tickerMatch = val.match(/^([A-Z]{4}\d{1,2}[A-Z]?|[A-Z]{3,5})$/);
                if (tickerMatch && !ticker) {
                    ticker = cleanTickerSymbol(tickerMatch[1]);
                }
                if (typeof row[c] === 'number') {
                    if (quantity === 0 && Number.isInteger(row[c]) && row[c] > 0)
                        quantity = row[c];
                    else if (price === 0 && row[c] > 0)
                        price = row[c];
                }
            }
        }
        if (ticker && quantity > 0) {
            const assetType = detectAssetType(ticker);
            transactions.push({
                id: `b3_${Date.now()}_${i}`,
                date: dateStr || new Date().toISOString().split('T')[0],
                ticker,
                type: assetType,
                operation: opStr,
                quantity,
                price: price > 0 ? price : 1,
                total: Number((quantity * (price > 0 ? price : 1)).toFixed(2)),
                broker,
            });
        }
    }
    return transactions;
}
