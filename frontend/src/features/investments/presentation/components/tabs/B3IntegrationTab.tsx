import React, { useState } from 'react';
import { InvestmentTransaction, AssetType } from '../../../domain/types';
import { parseB3FileClient } from '../../../infrastructure/b3ClientParser';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Link2,
  RefreshCw,
  Building2,
  ShieldCheck,
  TrendingUp,
  Trash2,
  Edit3,
  Check,
  X,
  Plus,
  Search,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface B3IntegrationTabProps {
  onImportSuccess: (transactions: InvestmentTransaction[]) => void;
}

export const B3IntegrationTab: React.FC<B3IntegrationTabProps> = ({ onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<InvestmentTransaction[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'FILE' | 'SYNC'>('FILE');
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvestmentTransaction>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      processSelectedFile(selected);
    }
  };

  const processSelectedFile = async (targetFile: File) => {
    setIsProcessing(true);
    try {
      const parsed = await parseB3FileClient(targetFile);
      if (parsed.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Nenhuma operação encontrada',
          text: 'Não identificamos registros de compra ou venda na planilha. Verifique se o arquivo exportado da B3 contém dados.',
          background: '#061530',
          color: '#fff',
          confirmButtonColor: '#F5B82E',
        });
        setPreviewData([]);
      } else {
        setPreviewData(parsed);
        const totalCompras = parsed.filter((t) => t.operation === 'BUY').length;
        const totalVendas = parsed.filter((t) => t.operation === 'SELL').length;
        Swal.fire({
          icon: 'success',
          title: 'Extrato B3 Processado!',
          html: `<div style="text-align:left; font-size:13px;">
            <p><b>${parsed.length}</b> operações identificadas com precisão:</p>
            <p style="color:#34D399; margin-top:4px;">• <b>${totalCompras}</b> ordens de Compra</p>
            <p style="color:#F87171; margin-top:2px;">• <b>${totalVendas}</b> ordens de Venda</p>
          </div>`,
          background: '#061530',
          color: '#fff',
          confirmButtonColor: '#F5B82E',
        });
      }
    } catch (err: any) {
      console.error('Erro ao processar arquivo B3:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro no processamento',
        text: err.message || 'Ocorreu um erro ao ler o arquivo da B3. Certifique-se de que é um formato .xlsx ou .csv válido.',
        background: '#061530',
        color: '#fff',
        confirmButtonColor: '#F5B82E',
      });
      setPreviewData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Excluir registro individual
  const handleDeleteRow = (id: string) => {
    setPreviewData((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditForm({});
    }
  };

  // Limpar todas as linhas
  const handleClearAll = () => {
    Swal.fire({
      title: 'Limpar todos os registros?',
      text: 'Todos os lançamentos importados serão removidos da lista.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, limpar',
      cancelButtonText: 'Cancelar',
      background: '#061530',
      color: '#fff',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#334155',
    }).then((res) => {
      if (res.isConfirmed) {
        setPreviewData([]);
        setFile(null);
        setEditingId(null);
      }
    });
  };

  // Iniciar edição de uma linha
  const handleStartEdit = (item: InvestmentTransaction) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Salvar edição da linha
  const handleSaveEdit = (id: string) => {
    if (!editForm.ticker || !editForm.price || !editForm.quantity) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Preencha o ticker, quantidade e preço unitário.',
        background: '#061530',
        color: '#fff',
        confirmButtonColor: '#F5B82E',
      });
      return;
    }

    setPreviewData((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            date: editForm.date || t.date,
            ticker: (editForm.ticker || t.ticker).toUpperCase().trim(),
            type: editForm.type || t.type,
            operation: editForm.operation || t.operation,
            quantity: Number(editForm.quantity) || t.quantity,
            price: Number(editForm.price) || t.price,
            broker: editForm.broker || t.broker,
            name: (editForm.ticker || t.ticker).toUpperCase().trim(),
          };
        }
        return t;
      })
    );

    setEditingId(null);
    setEditForm({});
  };

  // Adicionar linha manual na tabela
  const handleAddNewRow = () => {
    const newTx: InvestmentTransaction = {
      id: `b3_manual_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ticker: 'NOVO3',
      type: 'STOCK',
      operation: 'BUY',
      quantity: 100,
      price: 10.0,
      broker: 'B3 / Corretora',
      name: 'NOVO3',
    };
    setPreviewData((prev) => [newTx, ...prev]);
    setEditingId(newTx.id);
    setEditForm({ ...newTx });
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    onImportSuccess(previewData);
    Swal.fire({
      icon: 'success',
      title: 'Importação Concluída!',
      text: `${previewData.length} transações foram adicionadas à sua carteira com sucesso.`,
      background: '#061530',
      color: '#fff',
      confirmButtonColor: '#F5B82E',
    });
    setPreviewData([]);
    setFile(null);
    setEditingId(null);
  };

  const handleConnectB3Direct = () => {
    setIsSyncingDirect(true);
    setTimeout(() => {
      setIsSyncingDirect(false);
      Swal.fire({
        icon: 'info',
        title: 'Conexão Direta B3 (OAuth / Open Finance)',
        html: `<div style="text-align:left; font-size:12px; line-height:1.5;">
          <p>Para sincronização automática via link oficial da B3 sem upload manual:</p>
          <ul style="list-style:disc; margin-left:16px; margin-top:8px;">
            <li>A autorização direta requer credenciamento Open Finance institucional.</li>
            <li>Você pode utilizar a importação por <b>Arquivo (.xlsx / .csv)</b> gratuitamente e de forma instantânea agora mesmo.</li>
          </ul>
        </div>`,
        background: '#061530',
        color: '#fff',
        confirmButtonColor: '#F5B82E',
      });
    }, 1200);
  };

  // Filtragem dos registros pré-visualizados
  const filteredData = previewData.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.ticker.toLowerCase().includes(term) ||
      (t.broker && t.broker.toLowerCase().includes(term)) ||
      t.date.includes(term) ||
      (t.type && t.type.toLowerCase().includes(term))
    );
  });

  const totalComprasBrl = previewData
    .filter((t) => t.operation === 'BUY')
    .reduce((sum, t) => sum + t.quantity * t.price, 0);

  const totalVendasBrl = previewData
    .filter((t) => t.operation === 'SELL')
    .reduce((sum, t) => sum + t.quantity * t.price, 0);

  return (
    <div className="space-y-6">
      {/* Seletor de Modo: Conexão Direta vs Arquivo */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('FILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'FILE'
              ? 'bg-gold text-navy-deep shadow-md'
              : 'bg-navy-deep text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Importar Arquivo (.xlsx / .csv)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SYNC')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'SYNC'
              ? 'bg-gold text-navy-deep shadow-md'
              : 'bg-navy-deep text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>Conexão Direta B3 (Link Automático)</span>
        </button>
      </div>

      {activeSubTab === 'SYNC' ? (
        /* Modo Conexão Direta via Link B3 */
        <div className="rounded-2xl bg-navy-deep/80 border border-white/10 p-8 text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue/20 border border-blue/40 flex items-center justify-center text-blue-light">
            <Building2 className="h-8 w-8 text-gold" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-black text-white">Sincronização Direta com a B3</h3>
              <span className="rounded bg-gold px-2 py-0.5 text-[9px] font-black text-navy-deep uppercase">PRO</span>
            </div>
            <p className="text-xs text-slate-300">
              Conecte sua conta oficial da <b>Área do Investidor B3</b> via protocolo seguro para sincronizar automaticamente todas as compras, vendas e proventos diários.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="h-5 w-5 text-emerald-400 mb-1" />
              <h4 className="text-xs font-bold text-white">100% Seguro</h4>
              <p className="text-[11px] text-slate-400">Autenticação oficial via Gov.br / B3</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <RefreshCw className="h-5 w-5 text-gold mb-1" />
              <h4 className="text-xs font-bold text-white">Atualização Diária</h4>
              <p className="text-[11px] text-slate-400">Ordens sincronizadas sem intervenção manual</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <TrendingUp className="h-5 w-5 text-blue-light mb-1" />
              <h4 className="text-xs font-bold text-white">Proventos Automáticos</h4>
              <p className="text-[11px] text-slate-400">Dividendos e JCP creditados na carteira</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectB3Direct}
            disabled={isSyncingDirect}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-[#E2A11B] text-navy-deep font-black text-xs shadow-xl hover:from-gold-light hover:to-gold transition disabled:opacity-50"
          >
            {isSyncingDirect ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            <span>Conectar com a B3 (Área do Investidor)</span>
          </button>
        </div>
      ) : (
        /* Modo Upload de Arquivo */
        <div className="space-y-6">
          {/* Banner de Orientações */}
          <div className="rounded-2xl bg-gradient-to-r from-blue/20 via-navy-soft to-navy-deep border border-blue/40 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-blue/20 border border-blue/40 flex items-center justify-center text-blue-light text-2xl font-black shrink-0">
                📑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Importador de Extratos da B3</h3>
                  <span className="rounded bg-gold px-1.5 py-0.2 text-[9px] font-black text-navy-deep uppercase">PRO</span>
                </div>
                <p className="text-xs text-slate-300">
                  Suporta arquivos de <b>Resumo de Negociação</b> e <b>Movimentação Detalhada</b> (.xlsx, .xls ou .csv) exportados da Área do Investidor B3.
                </p>
              </div>
            </div>
          </div>

          {/* Área de Upload Drag & Drop */}
          <div className="rounded-2xl border-2 border-dashed border-white/20 bg-navy-deep/60 p-8 text-center hover:border-gold/60 transition">
            <div className="mx-auto h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-4">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              Envie o seu extrato de negociação da B3 (.xlsx ou .csv)
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              Acesse a <b>Área do Investidor da B3</b>, baixe o arquivo de negociação ou movimentação e anexe aqui.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#E2A11B] text-navy-deep font-extrabold text-xs cursor-pointer shadow-md hover:from-gold-light hover:to-gold transition">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{file ? file.name : 'Selecionar Arquivo da B3'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gold font-bold">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando linhas do extrato...</span>
              </div>
            )}
          </div>

          {/* Pré-visualização com Edição e Deleção */}
          {previewData.length > 0 && (
            <div className="rounded-2xl bg-navy-deep/80 border border-white/10 overflow-hidden space-y-4 p-5 shadow-xl">
              {/* Barra Superior de Ações */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      Transações Prontas para Importar ({previewData.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      (Total Compras: <b className="text-emerald-400">R$ {totalComprasBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> | Total Vendas: <b className="text-rose-400">R$ {totalVendasBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Você pode editar campos clicando no botão de lápis ou excluir linhas indesejadas antes de gravar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Busca Rápida */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar ticker..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold w-36 sm:w-44"
                    />
                  </div>

                  {/* Adicionar Linha */}
                  <button
                    type="button"
                    onClick={handleAddNewRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-gold" />
                    <span>Adicionar</span>
                  </button>

                  {/* Limpar Todas */}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpar Tudo</span>
                  </button>

                  {/* Confirmar e Salvar */}
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gold text-navy-deep font-extrabold text-xs shadow-lg hover:bg-gold-light transition"
                  >
                    <span>Confirmar & Salvar ({previewData.length})</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tabela Interativa de Registros */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b1b36] uppercase text-[10px] font-bold tracking-wider text-slate-400 sticky top-0 z-10 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Ticker</th>
                      <th className="px-3 py-3">Tipo</th>
                      <th className="px-3 py-3">Operação</th>
                      <th className="px-3 py-3 text-right">Quantidade</th>
                      <th className="px-3 py-3 text-right">Preço Unitário</th>
                      <th className="px-3 py-3 text-right">Valor Total</th>
                      <th className="px-3 py-3">Instituição / Corretora</th>
                      <th className="px-3 py-3 text-center w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredData.map((t) => {
                      const isEditing = editingId === t.id;

                      if (isEditing) {
                        return (
                          <tr key={t.id} className="bg-blue/10 border-2 border-gold/40">
                            {/* Data */}
                            <td className="p-2">
                              <input
                                type="date"
                                value={editForm.date || ''}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-white w-32 focus:outline-none"
                              />
                            </td>

                            {/* Ticker */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.ticker || ''}
                                onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value.toUpperCase() })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-gold font-black w-24 focus:outline-none uppercase"
                              />
                            </td>

                            {/* Tipo */}
                            <td className="p-2">
                              <select
                                value={editForm.type || 'STOCK'}
                                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as AssetType })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-white focus:outline-none"
                              >
                                <option value="STOCK">Ação</option>
                                <option value="FII">FII</option>
                                <option value="BDR">BDR</option>
                                <option value="ETF">ETF</option>
                                <option value="CRYPTO">Cripto</option>
                                <option value="FIXED_INCOME">Renda Fixa</option>
                                <option value="OTHER">Outros</option>
                              </select>
                            </td>

                            {/* Operação */}
                            <td className="p-2">
                              <select
                                value={editForm.operation || 'BUY'}
                                onChange={(e) => setEditForm({ ...editForm, operation: e.target.value as 'BUY' | 'SELL' })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs font-bold text-white focus:outline-none"
                              >
                                <option value="BUY">COMPRA</option>
                                <option value="SELL">VENDA</option>
                              </select>
                            </td>

                            {/* Quantidade */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0.0001"
                                step="any"
                                value={editForm.quantity ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-right text-white font-bold w-24 focus:outline-none"
                              />
                            </td>

                            {/* Preço Unitário */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={editForm.price ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-right text-white font-bold w-24 focus:outline-none"
                              />
                            </td>

                            {/* Total Calculado */}
                            <td className="p-2 text-right font-black text-emerald-400">
                              R$ {(((editForm.quantity || 0) * (editForm.price || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Instituição */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.broker || ''}
                                onChange={(e) => setEditForm({ ...editForm, broker: e.target.value })}
                                className="px-2 py-1 rounded bg-navy-deep border border-gold/60 text-xs text-slate-300 w-36 focus:outline-none"
                              />
                            </td>

                            {/* Ações de Salvar / Cancelar */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(t.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition shadow"
                                  title="Salvar alterações"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition shadow"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={t.id} className="hover:bg-white/5 transition group">
                          <td className="px-3 py-2.5 text-slate-300">{t.date}</td>
                          <td className="px-3 py-2.5 font-black text-white">{t.ticker}</td>
                          <td className="px-3 py-2.5 text-slate-400">{t.type}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                t.operation === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {t.operation === 'BUY' ? 'COMPRA' : 'VENDA'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-white">
                            {t.quantity.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-200">
                            R$ {t.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                            R$ {(t.quantity * t.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-[11px] truncate max-w-[180px]">
                            {t.broker || 'B3'}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(t)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-slate-400 hover:text-gold transition"
                                title="Editar esta operação"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(t.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="Excluir operação"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
