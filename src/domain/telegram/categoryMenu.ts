import type { Flow } from "@/domain/ledger/rules";

export const MENU_PAGE_SIZE = 8;
export const ROOT_PARENT = 0;

export interface MenuCategory {
  id: number;
  parentId: number | null;
  name: string;
  classification: Flow;
}

export interface MenuItem {
  categoryId: number;
  label: string;
  opensChildren: boolean;
}

export interface CategoryMenu {
  parent: MenuCategory | null;
  items: MenuItem[];
  page: number;
  pages: number;
}

const byName = (a: MenuCategory, b: MenuCategory) => a.name.localeCompare(b.name, "es");

export function buildCategoryMenu(categories: MenuCategory[], flow: Flow, parentId: number, requestedPage: number): CategoryMenu {
  const ofFlow = categories.filter((category) => category.classification === flow);
  const ids = new Set(ofFlow.map((category) => category.id));
  const isRoot = (category: MenuCategory) => category.parentId == null || !ids.has(category.parentId);
  const childrenOf = (id: number) => ofFlow.filter((category) => category.parentId === id).sort(byName);

  const parent = parentId === ROOT_PARENT ? null : (ofFlow.find((category) => category.id === parentId) ?? null);
  const shown = parent ? childrenOf(parent.id) : ofFlow.filter(isRoot).sort(byName);
  const pages = Math.max(1, Math.ceil(shown.length / MENU_PAGE_SIZE));
  const page = Math.min(Math.max(0, requestedPage), pages - 1);

  const items = shown.slice(page * MENU_PAGE_SIZE, (page + 1) * MENU_PAGE_SIZE).map((category) => ({
    categoryId: category.id,
    label: category.name,
    opensChildren: !parent && childrenOf(category.id).length > 0,
  }));
  return { parent, items, page, pages };
}
