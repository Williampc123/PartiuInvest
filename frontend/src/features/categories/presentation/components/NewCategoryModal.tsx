import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { FinancialCategory } from '@/core/types';
import {
  AVAILABLE_ICONS,
  CATEGORY_COLORS,
  getCategoryIconComponent,
} from '@/core/categories';
import { useAppStore } from '@/features/auth/useAppStore';
import { addCategoryToFirestore, updateCategoryInFirestore } from '@/features/dashboard/infrastructure/firestoreDataService';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'both';
  editingCategory?: FinancialCategory | null;
  onSuccess?: (newCategory: FinancialCategory) => void;
}

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  editingCategory,
  onSuccess,
}) => {
  const { user, addCategory } = useAppStore();

  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState<'expense' | 'income' | 'both'>(
    editingCategory?.type || defaultType
  );
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon || 'Tag');
  const [selectedColor, setSelectedColor] = useState(
    editingCategory?.color || CATEGORY_COLORS[0]
  );
  const [searchIconQuery, setSearchIconQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar dados quando o modal abre ou a categoria a editar muda
  useEffect(() => {
    if (isOpen) {
      setName(editingCategory?.name || '');
      setType(editingCategory?.type || defaultType);
      setSelectedIcon(editingCategory?.icon || 'Tag');
      setSelectedColor(editingCategory?.color || CATEGORY_COLORS[0]);
      setErrorMsg(null);
      setSearchIconQuery('');
    }
  }, [isOpen, editingCategory, defaultType]);

  if (!isOpen) return null;

  // Filtragem de ícones na busca
  const filteredIcons = AVAILABLE_ICONS.filter((item) => {
    if (!searchIconQuery.trim()) return true;
    const q = searchIconQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const PreviewIconComponent = getCategoryIconComponent(selectedIcon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Informe o nome da categoria.');
      return;
    }

    setLoading(true);

    try {
      if (editingCategory && user?.familyId) {
        // Atualizar
        await updateCategoryInFirestore(user.familyId, editingCategory.id, {
          name: trimmedName,
          type,
          icon: selectedIcon,
          color: selectedColor,
        });

        const updated: FinancialCategory = {
          ...editingCategory,
          name: trimmedName,
          type,
          icon: selectedIcon,
          color: selectedColor,
        };
        addCategory(updated);
        onSuccess?.(updated);
      } else {
        // Criar Nova
        const catData: Omit<FinancialCategory, 'id'> = {
          name: trimmedName,
          type,
          icon: selectedIcon,
          color: selectedColor,
          isCustom: true,
          createdAt: new Date().toISOString(),
        };

        if (user?.familyId) {
          const created = await addCategoryToFirestore(user.familyId, catData);
          addCategory(created);
          onSuccess?.(created);
        } else {
          const localCat: FinancialCategory = {
            ...catData,
            id: 'cat_' + Date.now(),
          };
          addCategory(localCat);
          onSuccess?.(localCat);
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err);
      setErrorMsg('Ocorreu um erro ao salvar a categoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-lg bg-white border-white/95 shadow-2xl p-6 rounded-[28px] relative max-h-[92vh] flex flex-col">
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 icon-btn text-muted hover:text-navy z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-navy flex items-center gap-2">
            <Tag className="h-5 w-5 text-gold-deep" />
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <p className="text-xs text-muted">
            Personalize o nome, tipo, ícone e cor para organizar suas finanças.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Formulário com Scroll interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Pré-visualização do Badge da Categoria */}
          <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl grid place-items-center shrink-0 shadow-sm transition-transform duration-200"
                style={{
                  backgroundColor: `${selectedColor}22`,
                  color: selectedColor,
                }}
              >
                <PreviewIconComponent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">
                  {name.trim() || 'Nome da Categoria'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-[11px] text-muted capitalize">
                    {type === 'expense'
                      ? 'Despesa'
                      : type === 'income'
                      ? 'Receita'
                      : 'Receita e Despesa'}
                  </span>
                </div>
              </div>
            </div>
            <span className="pill bg-white text-navy text-[10px] font-bold border border-navy/10">
              Prévia
            </span>
          </div>

          {/* Nome da Categoria */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pets, Farmácia, Combustível, Streaming..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-navy/15 bg-white text-sm text-navy focus:ring-2 focus:ring-gold focus:outline-none font-medium"
            />
          </div>

          {/* Tipo: Despesa vs Receita vs Ambos */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Tipo de Aplicação
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-navy/5 border border-navy/10">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'expense'
                    ? 'bg-danger text-white shadow-sm'
                    : 'text-muted hover:text-navy'
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Despesa</span>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'income'
                    ? 'bg-ok text-white shadow-sm'
                    : 'text-muted hover:text-navy'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Receita</span>
              </button>
              <button
                type="button"
                onClick={() => setType('both')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'both'
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-muted hover:text-navy'
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>Ambos</span>
              </button>
            </div>
          </div>

          {/* Paleta de Cores */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_COLORS.map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 ring-2 ring-navy ring-offset-2 shadow-sm'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Ícones com Busca */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-navy">
                Escolher Ícone
              </label>
              <span className="text-[11px] text-muted">
                {filteredIcons.length} ícones disponíveis
              </span>
            </div>

            {/* Campo de Busca de Ícone */}
            <div className="relative mb-2.5">
              <Search className="h-3.5 w-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar ícone (ex: carro, café, saúde, casa, pet...)"
                value={searchIconQuery}
                onChange={(e) => setSearchIconQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-navy/15 bg-white text-xs text-navy focus:ring-2 focus:ring-gold focus:outline-none placeholder:text-muted/60"
              />
            </div>

            {/* Grid de Ícones Selecionáveis */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl border border-navy/10 bg-navy/[0.02]">
              {filteredIcons.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    title={item.label}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                      isSelected
                        ? 'bg-gold/20 border-2 border-gold text-navy shadow-sm scale-105'
                        : 'bg-white hover:bg-navy/5 text-muted hover:text-navy border border-navy/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[9px] font-semibold truncate w-full text-center leading-none">
                      {item.label.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-navy/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-line text-xs h-10 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold text-xs h-10 px-5 gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
