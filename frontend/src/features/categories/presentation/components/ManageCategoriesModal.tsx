import React, { useState } from 'react';
import {
  X,
  Plus,
  Tag,
  Search,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { FinancialCategory } from '@/core/types';
import { getCategoryIconComponent } from '@/core/categories';
import { useAppStore } from '@/features/auth/useAppStore';
import { deleteCategoryFromFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';
import { NewCategoryModal } from './NewCategoryModal';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (newCategory: FinancialCategory) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const { categories, user, removeCategory } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredCategories = categories.filter((cat) => {
    if (filterType === 'expense' && cat.type === 'income') return false;
    if (filterType === 'income' && cat.type === 'expense') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = async (cat: FinancialCategory) => {
    if (confirm(`Deseja realmente remover a categoria "${cat.name}"?`)) {
      try {
        if (user?.familyId) {
          await deleteCategoryFromFirestore(user.familyId, cat.id);
        }
        removeCategory(cat.id);
        showToast(`Categoria "${cat.name}" removida com sucesso.`);
      } catch (err) {
        console.error('Erro ao deletar categoria:', err);
      }
    }
  };

  const handleEdit = (cat: FinancialCategory) => {
    setEditingCategory(cat);
    setIsNewCategoryOpen(true);
  };

  const handleCreated = (newCat: FinancialCategory) => {
    showToast(`Categoria "${newCat.name}" salva com sucesso!`);
    onCategoryCreated?.(newCat);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="card w-full max-w-xl bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[90vh] flex flex-col">
          {/* Toast */}
          {toastMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-navy text-white px-4 py-2.5 shadow-2xl flex items-center gap-2 text-xs border border-gold/40 animate-in fade-in">
              <Sparkles className="h-4 w-4 text-gold shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Botão Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 icon-btn text-muted hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pr-8">
            <div>
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <Tag className="h-5 w-5 text-gold-deep" />
                Gerenciar Categorias
              </h3>
              <p className="text-xs text-muted">
                Adicione, personalize e selecione os ícones para cada categoria financeira.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsNewCategoryOpen(true);
              }}
              className="btn-gold text-xs h-9 px-3.5 gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
            <div className="relative flex-1 w-full">
              <Search className="h-3.5 w-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-navy/15 bg-white text-xs text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/60"
              />
            </div>

            <div className="flex items-center gap-1 bg-navy/5 p-1 rounded-xl w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  filterType === 'expense'
                    ? 'bg-danger text-white shadow-xs'
                    : 'text-muted hover:text-danger'
                }`}
              >
                <TrendingDown className="h-3 w-3" />
                <span>Despesas</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  filterType === 'income'
                    ? 'bg-ok text-white shadow-xs'
                    : 'text-muted hover:text-ok'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                <span>Receitas</span>
              </button>
            </div>
          </div>

          {/* Lista de Categorias com Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-navy/5 border border-navy/10 rounded-2xl bg-white pr-1">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Tag className="h-8 w-8 text-muted mx-auto" />
                <p className="text-xs text-muted">Nenhuma categoria encontrada.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const IconComponent = getCategoryIconComponent(cat.icon || cat.name);
                const color = cat.color || '#F5B82E';

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-navy/[0.02] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-9 w-9 rounded-xl grid place-items-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        <IconComponent className="h-4.5 w-4.5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-navy truncate">
                            {cat.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          <span className="capitalize">
                            {cat.type === 'expense'
                              ? 'Despesa'
                              : cat.type === 'income'
                              ? 'Receita'
                              : 'Receita / Despesa'}
                          </span>
                          <span>•</span>
                          <span>Ícone: {cat.icon || 'Tag'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        title="Editar Categoria"
                        className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-navy/5 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        title="Excluir Categoria"
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-navy/10">
            <span className="text-[11px] text-muted">
              {categories.length} categorias cadastradas
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-line text-xs h-9 px-4"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Criação / Edição de Categoria */}
      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => {
          setIsNewCategoryOpen(false);
          setEditingCategory(null);
        }}
        defaultType={filterType === 'all' ? 'expense' : filterType}
        editingCategory={editingCategory}
        onSuccess={handleCreated}
      />
    </>
  );
};
