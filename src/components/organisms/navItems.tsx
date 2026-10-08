import { ChartColumn, ChartPie, Flag, House, List, Repeat, Settings, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/domain/shared/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  inBottomBar: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.dashboard, label: "Resumen", icon: House, inBottomBar: true },
  { href: ROUTES.accounts, label: "Cuentas", icon: Wallet, inBottomBar: false },
  { href: ROUTES.transactions, label: "Movimientos", icon: List, inBottomBar: true },
  { href: ROUTES.budgets, label: "Presupuestos", icon: ChartPie, inBottomBar: true },
  { href: ROUTES.spending, label: "Gasto por categoría", icon: ChartColumn, inBottomBar: false },
  { href: ROUTES.recurring, label: "Recurrentes", icon: Repeat, inBottomBar: false },
  { href: ROUTES.projection, label: "Proyección", icon: TrendingUp, inBottomBar: false },
  { href: ROUTES.goals, label: "Metas", icon: Flag, inBottomBar: false },
  { href: ROUTES.import, label: "Importar estados", icon: List, inBottomBar: false },
  { href: ROUTES.settings, label: "Configuración", icon: Settings, inBottomBar: false },
];
