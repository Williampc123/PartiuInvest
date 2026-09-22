import React, { useState } from 'react';
import { useAppStore } from '@/features/auth/useAppStore';
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { FinancialCategory } from '@/core/types';
import { getCategoryIconComponent } from '@/core/categories';
import { deleteCategoryFromFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';
import { NewCategoryModal } from '../components/NewCategoryModal';

export const CategoriesPage: React.FC = () => {
  const { categories, transactions, user, removeCategory } = useAppStore();

  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Contagem de categorias
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  // Mapa de uso das categorias nas transações
  const usageCountMap = transactions.reduce((acc, t) => {
    const catName = t.category;
    if (catName) {
      acc[catName.toLowerCase()] = (acc[catName.toLowerCase()] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filtragem da lista
  const filteredCategories = categories.filter((cat) => {
    if (filterType === 'expense' && cat.type === 'income') return false;
    if (filterType === 'income' && cat.type === 'expense') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Excluir categoria com confirmação
  const handleDelete = async (cat: FinancialCategory) => {
    const usage = usageCountMap[cat.name.toLowerCase()] || 0;
    const warningMsg = usage > 0
      ? `Atenção: A categoria "${cat.name}" possui ${usage} movimentação(ões) vinculada(s).\n\nDeseja realmente excluí-la do sistema?`
      : `Deseja realmente remover a categoria "${cat.name}"?`;

    if (confirm(warningMsg)) {
      try {
        if (user?.familyId) {
          await deleteCategoryFromFirestore(user.familyId, cat.id);
        }
        removeCategory(cat.id);
        showToast(`Categoria "${cat.name}" removida com sucesso.`);
      } catch (err) {
        console.error('Erro ao deletar categoria:', err);
        showToast('Erro ao remover categoria. Tente novamente.');
      }
    }
  };

  // Abrir modal de edição
  const handleEdit = (cat: FinancialCategory) => {
    setEditingCategory(cat);
    setIsNewCategoryOpen(true);
  };

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsNewCategoryOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toast de Notificação */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy text-white px-4 py-3 shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 border border-gold/40">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Topo do Módulo de Categorias */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-navy-deep shadow-md">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Categorias Financeiras</h2>
            <p className="text-xs text-muted">
              Gerencie, crie, edite e remova categorias de receitas e despesas da sua família.
            </p>
          </div>
        </div>

        {/* Botão de Criação */}
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-gold text-xs h-[42px] px-4 gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid de Métricas / Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total de Categorias */}
        <div className="card p-4 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-navy/10 text-navy grid place-items-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted">Total de Categorias</span>
            <div className="text-xl font-extrabold text-navy leading-tight">
              {categories.length}
            </div>
          </div>
        </div>

        {/* Categorias de Despesas */}
        <div className="card p-4 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-danger/10 text-danger grid place-items-center shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted">Categorias de Despesas</span>
            <div className="text-xl font-extrabold text-danger leading-tight">
              {expenseCategories.length}
            </div>
          </div>
        </div>

        {/* Categorias de Receitas */}
        <div className="card p-4 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-ok/10 text-ok grid place-items-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted">Categorias de Receitas</span>
            <div className="text-xl font-extrabold text-ok leading-tight">
              {incomeCategories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome da categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-navy/15 bg-white text-xs text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/60"
          />
        </div>

        {/* Tabs de Filtro de Tipo */}
        <div className="flex items-center gap-1.5 bg-navy/5 p-1 rounded-xl w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-navy text-white shadow-xs'
                : 'text-muted hover:text-navy'
            }`}
          >
            Todas ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'expense'
                ? 'bg-danger text-white shadow-xs'
                : 'text-muted hover:text-danger'
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Despesas ({expenseCategories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterType === 'income'
                ? 'bg-ok text-white shadow-xs'
                : 'text-muted hover:text-ok'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Receitas ({incomeCategories.length})</span>
          </button>
        </div>
      </div>

      {/* Grid de Categorias */}
      {filteredCategories.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-navy/5 text-muted grid place-items-center mx-auto">
            <Tag className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-navy">Nenhuma categoria encontrada</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? `Não encontramos resultados para "${searchQuery}". Tente outro termo ou limpe a busca.`
              : 'Nenhuma categoria cadastrada para este filtro.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn-line text-xs h-9 px-4 mt-2"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCategories.map((cat) => {
            const IconComponent = getCategoryIconComponent(cat.icon || cat.name);
            const color = cat.color || '#F5B82E';
            const usageCount = usageCountMap[cat.name.toLowerCase()] || 0;

            return (
              <div
                key={cat.id}
                className="card p-4 flex flex-col justify-between gap-3 hover:shadow-lg transition-all duration-200 border-white/90 group"
              >
                {/* Linha Superior: Ícone, Nome e Tipo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-11 w-11 rounded-2xl grid place-items-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-navy truncate" title={cat.name}>
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`pill text-[10px] font-bold px-2 py-0.5 border ${
                            cat.type === 'expense'
                              ? 'bg-danger/10 text-danger border-danger/20'
                              : cat.type === 'income'
                              ? 'bg-ok/10 text-ok border-ok/20'
                              : 'bg-navy/10 text-navy border-navy/20'
                          }`}
                        >
                          {cat.type === 'expense'
                            ? 'Despesa'
                            : cat.type === 'income'
                            ? 'Receita'
                            : 'Receita / Despesa'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linha Inferior: Uso e Ações (Editar / Deletar) */}
                <div className="flex items-center justify-between pt-2.5 border-t border-navy/5 text-xs">
                  <span className="text-[11px] text-muted">
                    {usageCount === 1 ? '1 movimentação' : `${usageCount} movimentações`}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      title="Editar Categoria"
                      className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-navy/5 transition active:scale-95"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      title="Excluir Categoria"
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Categoria */}
      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => {
          setIsNewCategoryOpen(false);
          setEditingCategory(null);
        }}
        defaultType={filterType === 'all' ? 'expense' : filterType}
        editingCategory={editingCategory}
        onSuccess={(savedCat) => {
          showToast(`Categoria "${savedCat.name}" salva com sucesso!`);
        }}
      />
    </div>
  );
};
