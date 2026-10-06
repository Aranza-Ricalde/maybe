import { Chip } from "@/components/atoms/Chip";
import { Text } from "@/components/atoms/Text";
import { DetailModal } from "./DetailModal";

export interface TelegramLinkInfoProps {
  isLinked: boolean;
  linkCode: string;
}

export function TelegramLinkInfo({ isLinked, linkCode }: TelegramLinkInfoProps) {
  if (isLinked) {
    return <Chip tone="success">Vinculado</Chip>;
  }

  return (
    <div className="flex items-center gap-2">
      <Chip tone="muted">Sin vincular</Chip>
      <DetailModal title="Vincular Telegram" triggerLabel="¿Cómo vincular? →">
        <Text>Para registrar movimientos por chat:</Text>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground">
          <li>
            Abre Telegram y busca <span className="font-semibold">@V2_MaybeBot</span>.
          </li>
          <li>
            Mándale el comando <code className="rounded bg-separator px-1 py-0.5 text-xs">/link {linkCode}</code>.
          </li>
          <li>Listo — tu cuenta queda vinculada y ya puedes mandarle tus gastos directo por chat.</li>
        </ol>
      </DetailModal>
    </div>
  );
}
