import { ArrowLeftRight, ChartColumn, ChartPie, FileUp, House, Repeat, Settings, Wallet, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/domain/shared/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  inBottomBar: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: "Resumen", items: [{ href: ROUTES.dashboard, label: "Resumen", icon: House, inBottomBar: true }] },
  {
    label: "Dinero",
    items: [
      { href: ROUTES.accounts, label: "Cuentas", icon: Wallet, inBottomBar: false },
      { href: ROUTES.transactions, label: "Movimientos", icon: ArrowLeftRight, inBottomBar: true },
      { href: ROUTES.import, label: "Importar estados", icon: FileUp, inBottomBar: false },
    ],
  },
  {
    label: "Planeación",
    items: [
      { href: ROUTES.budgets, label: "Presupuestos", icon: ChartPie, inBottomBar: true },
      { href: ROUTES.recurring, label: "Recurrentes", icon: Repeat, inBottomBar: false },
    ],
  },
  { label: "Análisis", items: [{ href: ROUTES.stats, label: "Estadísticas", icon: ChartColumn, inBottomBar: true }] },
  { label: "Sistema", items: [{ href: ROUTES.settings, label: "Configuración", icon: Settings, inBottomBar: false }] },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
