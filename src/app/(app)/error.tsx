"use client";

import { Button } from "@heroui/react";
import { EmptyState } from "@/components/molecules/EmptyState";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Algo salió mal al cargar esta pantalla"
      description="Tus datos están a salvo. Inténtalo de nuevo; si el problema sigue, avísanos."
      action={
        <Button variant="primary" onPress={reset}>
          Reintentar
        </Button>
      }
    />
  );
}
