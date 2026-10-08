"use client";

import { useRouter } from "next/navigation";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NAV_GROUPS } from "./navItems";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Ir a…" description="Busca una pantalla y presiona Enter.">
      <Command>
      <CommandInput placeholder="Ir a… (Cuentas, Presupuestos, Estadísticas)" />
      <CommandList>
        <CommandEmpty>No hay resultados.</CommandEmpty>
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(item.href);
                }}
              >
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
