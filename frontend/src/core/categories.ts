import React from 'react';
import {
  Utensils,
  Home,
  Car,
  HeartPulse,
  GraduationCap,
  Film,
  Receipt,
  Briefcase,
  TrendingUp,
  Gift,
  ShoppingBag,
  Coffee,
  Smartphone,
  Plane,
  Music,
  Dumbbell,
  Fuel,
  Zap,
  Tv,
  Baby,
  PawPrint,
  Wallet,
  DollarSign,
  PiggyBank,
  BookOpen,
  Wifi,
  ShieldCheck,
  ShoppingBasket,
  Smile,
  Package,
  Wrench,
  Percent,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { FinancialCategory, BoxCategory } from './types';

/**
 * Catálogo de ícones disponíveis para seleção pelo usuário
 */
export interface AvailableIcon {
  name: string;
  label: string;
  category: string;
  icon: LucideIcon;
}

export const AVAILABLE_ICONS: AvailableIcon[] = [
  // Alimentação & Mercado
  { name: 'Utensils', label: 'Restaurante / Alimentação', category: 'Alimentação', icon: Utensils },
  { name: 'ShoppingBasket', label: 'Supermercado / Feira', category: 'Alimentação', icon: ShoppingBasket },
  { name: 'Coffee', label: 'Café / Lanches', category: 'Alimentação', icon: Coffee },

  // Moradia & Contas
  { name: 'Home', label: 'Moradia / Aluguel', category: 'Moradia & Contas', icon: Home },
  { name: 'Receipt', label: 'Boletos / Contas Fixas', category: 'Moradia & Contas', icon: Receipt },
  { name: 'Zap', label: 'Energia Elétrica / Luz', category: 'Moradia & Contas', icon: Zap },
  { name: 'Wifi', label: 'Internet / Telefonia', category: 'Moradia & Contas', icon: Wifi },
  { name: 'Wrench', label: 'Manutenção / Reforma', category: 'Moradia & Contas', icon: Wrench },

  // Transporte & Automóvel
  { name: 'Car', label: 'Carro / Automóvel', category: 'Transporte', icon: Car },
  { name: 'Fuel', label: 'Combustível / Posto', category: 'Transporte', icon: Fuel },
  { name: 'Plane', label: 'Viagem / Passagens', category: 'Transporte', icon: Plane },

  // Lazer, Compras & Estilo de Vida
  { name: 'Film', label: 'Cinema / Lazer', category: 'Lazer & Estilo', icon: Film },
  { name: 'Tv', label: 'Streaming / TV', category: 'Lazer & Estilo', icon: Tv },
  { name: 'Music', label: 'Música / Shows', category: 'Lazer & Estilo', icon: Music },
  { name: 'ShoppingBag', label: 'Compras / Roupas', category: 'Lazer & Estilo', icon: ShoppingBag },
  { name: 'Smartphone', label: 'Eletrônicos / Apps', category: 'Lazer & Estilo', icon: Smartphone },
  { name: 'Gift', label: 'Presentes', category: 'Lazer & Estilo', icon: Gift },

  // Saúde, Bem-estar & Esportes
  { name: 'HeartPulse', label: 'Saúde / Farmácia / Médico', category: 'Saúde', icon: HeartPulse },
  { name: 'Dumbbell', label: 'Academia / Esportes', category: 'Saúde', icon: Dumbbell },

  // Educação & Conhecimento
  { name: 'GraduationCap', label: 'Educação / Faculdade / Escola', category: 'Educação', icon: GraduationCap },
  { name: 'BookOpen', label: 'Livros / Cursos', category: 'Educação', icon: BookOpen },

  // Família, Filhos & Pets
  { name: 'Baby', label: 'Bebê / Crianças / Filhos', category: 'Família', icon: Baby },
  { name: 'PawPrint', label: 'Pets / Animais', category: 'Família', icon: PawPrint },
  { name: 'Smile', label: 'Família / Pessoal', category: 'Família', icon: Smile },

  // Renda, Trabalho & Finanças
  { name: 'Briefcase', label: 'Salário / Trabalho', category: 'Renda & Finanças', icon: Briefcase },
  { name: 'TrendingUp', label: 'Investimentos / Rendimentos', category: 'Renda & Finanças', icon: TrendingUp },
  { name: 'PiggyBank', label: 'Poupança / Cofrinho', category: 'Renda & Finanças', icon: PiggyBank },
  { name: 'DollarSign', label: 'Serviços / Freelance', category: 'Renda & Finanças', icon: DollarSign },
  { name: 'Wallet', label: 'Mesada / Dinheiro', category: 'Renda & Finanças', icon: Wallet },
  { name: 'Percent', label: 'Dividendos / Taxas', category: 'Renda & Finanças', icon: Percent },
  { name: 'ShieldCheck', label: 'Reserva / Seguros', category: 'Renda & Finanças', icon: ShieldCheck },
  { name: 'Package', label: 'Outros / Diversos', category: 'Geral', icon: Package },
];

/**
 * Mapeador rápido de string -> LucideIcon
 */
export const ICON_MAP: Record<string, LucideIcon> = AVAILABLE_ICONS.reduce((acc, item) => {
  acc[item.name] = item.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

/**
 * Paleta de cores recomendadas para categorias
 */
export const CATEGORY_COLORS = [
  '#F5B82E', // Dourado
  '#3F6FD8', // Azul
  '#22C55E', // Verde
  '#EF4444', // Vermelho
  '#A855F7', // Roxo
  '#EC4899', // Rosa
  '#F97316', // Laranja
  '#14B8A6', // Ciano/Teal
  '#6366F1', // Índigo
  '#0A1F44', // Navy
  '#64748B', // Cinza azulado
  '#84CC16', // Verde Lima
];

/**
 * Categorias Padrão do Sistema
 */
export const DEFAULT_CATEGORIES: FinancialCategory[] = [
  // Despesas
  { id: 'cat_moradia', name: 'Moradia', type: 'expense', icon: 'Home', color: '#3F6FD8', isCustom: true },
  { id: 'cat_alimentacao', name: 'Alimentação', type: 'expense', icon: 'Utensils', color: '#F5B82E', isCustom: true },
  { id: 'cat_supermercado', name: 'Supermercado', type: 'expense', icon: 'ShoppingBasket', color: '#14B8A6', isCustom: true },
  { id: 'cat_transporte', name: 'Transporte', type: 'expense', icon: 'Car', color: '#F97316', isCustom: true },
  { id: 'cat_combustivel', name: 'Combustível', type: 'expense', icon: 'Fuel', color: '#EA580C', isCustom: true },
  { id: 'cat_lazer', name: 'Lazer', type: 'expense', icon: 'Film', color: '#EC4899', isCustom: true },
  { id: 'cat_saude', name: 'Saúde', type: 'expense', icon: 'HeartPulse', color: '#EF4444', isCustom: true },
  { id: 'cat_educacao', name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#22C55E', isCustom: true },
  { id: 'cat_contas_fixas', name: 'Contas Fixas', type: 'expense', icon: 'Receipt', color: '#6366F1', isCustom: true },
  { id: 'cat_energia', name: 'Energia Elétrica', type: 'expense', icon: 'Zap', color: '#EAB308', isCustom: true },
  { id: 'cat_internet', name: 'Internet / Telefonia', type: 'expense', icon: 'Wifi', color: '#06B6D4', isCustom: true },
  { id: 'cat_pets', name: 'Pets', type: 'expense', icon: 'PawPrint', color: '#A855F7', isCustom: true },
  { id: 'cat_compras', name: 'Compras & Vestuário', type: 'expense', icon: 'ShoppingBag', color: '#D946EF', isCustom: true },
  { id: 'cat_streaming', name: 'Streaming & Assinaturas', type: 'expense', icon: 'Tv', color: '#8B5CF6', isCustom: true },
  { id: 'cat_manutencao', name: 'Manutenção da Casa', type: 'expense', icon: 'Wrench', color: '#78716C', isCustom: true },
  { id: 'cat_filhos', name: 'Filhos & Bebê', type: 'expense', icon: 'Baby', color: '#F43F5E', isCustom: true },
  { id: 'cat_impostos', name: 'Impostos & Taxas', type: 'expense', icon: 'Percent', color: '#64748B', isCustom: true },
  { id: 'cat_viagens', name: 'Viagens', type: 'expense', icon: 'Plane', color: '#0284C7', isCustom: true },
  { id: 'cat_academia', name: 'Academia & Esportes', type: 'expense', icon: 'Dumbbell', color: '#10B981', isCustom: true },
  { id: 'cat_outros_despesa', name: 'Outros', type: 'expense', icon: 'Package', color: '#64748B', isCustom: true },

  // Receitas
  { id: 'cat_salario', name: 'Salário', type: 'income', icon: 'Briefcase', color: '#22C55E', isCustom: true },
  { id: 'cat_investimentos', name: 'Investimentos / Dividendos', type: 'income', icon: 'TrendingUp', color: '#3F6FD8', isCustom: true },
  { id: 'cat_freelance', name: 'Freelance / Serviços', type: 'income', icon: 'DollarSign', color: '#F5B82E', isCustom: true },
  { id: 'cat_mesada', name: 'Mesada / Presente', type: 'income', icon: 'Gift', color: '#A855F7', isCustom: true },
  { id: 'cat_venda_bens', name: 'Venda de Bens / Desapegos', type: 'income', icon: 'ShoppingBag', color: '#059669', isCustom: true },
  { id: 'cat_cashback', name: 'Cashback / Bonificações', type: 'income', icon: 'Sparkles', color: '#E11D48', isCustom: true },
  { id: 'cat_outros_receita', name: 'Outros', type: 'income', icon: 'Package', color: '#64748B', isCustom: true },
];
 
/**
 * Categorias Padrão para Caixinhas / Metas Financeiras
 */
export const DEFAULT_BOX_CATEGORIES: BoxCategory[] = [
  {
    id: 'emergency',
    name: 'emergency',
    label: 'Reserva de Emergência',
    icon: 'ShieldCheck',
    color: '#F5B82E',
    defaultName: 'Reserva de Emergência',
    isCustom: false,
  },
  {
    id: 'opportunity',
    name: 'opportunity',
    label: 'Reserva de Oportunidade',
    icon: 'Zap',
    color: '#F97316',
    defaultName: 'Reserva de Oportunidade',
    isCustom: false,
  },
  {
    id: 'dream',
    name: 'dream',
    label: 'Sonho / Viagem / Bem',
    icon: 'Plane',
    color: '#3F6FD8',
    defaultName: 'Viagem dos Sonhos',
    isCustom: false,
  },
  {
    id: 'investment',
    name: 'investment',
    label: 'Investimentos & Futuro',
    icon: 'TrendingUp',
    color: '#0A1F44',
    defaultName: 'Fundo de Liberdade Financeira',
    isCustom: false,
  },
  {
    id: 'education',
    name: 'education',
    label: 'Educação / Capacitação',
    icon: 'GraduationCap',
    color: '#22C55E',
    defaultName: 'Faculdade / Especialização',
    isCustom: false,
  },
];

/**
 * Retorna o ícone correspondente à categoria (por objeto ou por nome)
 */
export function getCategoryIconComponent(iconNameOrCategoryName?: string): LucideIcon {
  if (!iconNameOrCategoryName) return Package;

  // 1. Tentar por nome de ícone direto
  if (ICON_MAP[iconNameOrCategoryName]) {
    return ICON_MAP[iconNameOrCategoryName];
  }

  // 2. Tentar casar com categoria de caixinha por id ou nome
  const boxCat = DEFAULT_BOX_CATEGORIES.find(
    (b) => b.id.toLowerCase() === iconNameOrCategoryName.toLowerCase() || b.name.toLowerCase() === iconNameOrCategoryName.toLowerCase() || b.label.toLowerCase() === iconNameOrCategoryName.toLowerCase()
  );
  if (boxCat && ICON_MAP[boxCat.icon]) {
    return ICON_MAP[boxCat.icon];
  }

  // 3. Tentar casar com categoria padrão de transações por nome
  const defaultCat = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === iconNameOrCategoryName.toLowerCase()
  );
  if (defaultCat && ICON_MAP[defaultCat.icon]) {
    return ICON_MAP[defaultCat.icon];
  }

  // Fallback baseado em palavras-chave comuns
  const lower = iconNameOrCategoryName.toLowerCase();
  if (lower.includes('emergenc') || lower.includes('seguranca') || lower.includes('reserva')) return ShieldCheck;
  if (lower.includes('oportunidade') || lower.includes('agro') || lower.includes('rapido') || lower.includes('oferta')) return Zap;
  if (lower.includes('comida') || lower.includes('alimento') || lower.includes('mercado') || lower.includes('restaurante')) return Utensils;
  if (lower.includes('casa') || lower.includes('aluguel') || lower.includes('moradia') || lower.includes('condom') || lower.includes('reforma')) return Home;
  if (lower.includes('carro') || lower.includes('uber') || lower.includes('transporte') || lower.includes('combustivel') || lower.includes('veiculo')) return Car;
  if (lower.includes('saude') || lower.includes('farmacia') || lower.includes('medico') || lower.includes('hospital')) return HeartPulse;
  if (lower.includes('estudo') || lower.includes('curso') || lower.includes('faculdade') || lower.includes('educacao') || lower.includes('escola')) return GraduationCap;
  if (lower.includes('salario') || lower.includes('trabalho') || lower.includes('remuneracao')) return Briefcase;
  if (lower.includes('invest') || lower.includes('rendimento') || lower.includes('dividendo') || lower.includes('futuro')) return TrendingUp;
  if (lower.includes('lazer') || lower.includes('cinema') || lower.includes('viagem') || lower.includes('show') || lower.includes('ferias')) return Plane;
  if (lower.includes('pet') || lower.includes('cachorro') || lower.includes('gato')) return PawPrint;
  if (lower.includes('conta') || lower.includes('boleto') || lower.includes('luz') || lower.includes('agua')) return Receipt;

  return Sparkles;
}

/**
 * Retorna a cor correspondente à categoria
 */
export function getCategoryColor(categoryName?: string, categories: FinancialCategory[] = DEFAULT_CATEGORIES): string {
  if (!categoryName) return '#64748B';

  const boxCat = DEFAULT_BOX_CATEGORIES.find(
    (b) => b.id.toLowerCase() === categoryName.toLowerCase() || b.name.toLowerCase() === categoryName.toLowerCase() || b.label.toLowerCase() === categoryName.toLowerCase()
  );
  if (boxCat?.color) return boxCat.color;

  const found = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (found?.color) return found.color;

  const defaultFound = DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (defaultFound?.color) return defaultFound.color;

  return '#F5B82E';
}
