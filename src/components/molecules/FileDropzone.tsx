"use client";

import { useRef, type ReactNode } from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFileDrop } from "@/hooks/useFileDrop";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  accept: string;
  title: string;
  touchTitle?: string;
  hint: string;
  buttonLabel: string;
  footnote?: ReactNode;
  inputTestId?: string;
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({ accept, title, touchTitle, hint, buttonLabel, footnote, inputTestId, compact = false, onFiles }: FileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const { dragging, dropProps } = useFileDrop(accept, onFiles);

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        data-testid={inputTestId}
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <Card className={cn("border-2 border-dashed transition-colors", dragging && "border-primary bg-primary/5")} {...dropProps}>
        <CardContent className={cn("flex items-center gap-3 text-center", compact ? "flex-wrap justify-between py-0 text-left" : "flex-col py-4")}>
          {compact ? (
            <Text size="sm" tone="muted">
              Arrastra más PDFs aquí o agrégalos con el botón.
            </Text>
          ) : (
            <>
              <Text weight="medium">
                {touchTitle && <span className="md:hidden">{touchTitle}</span>}
                <span className={touchTitle ? "max-md:hidden" : undefined}>{title}</span>
              </Text>
              <Text size="sm" tone="muted">
                {hint}
              </Text>
            </>
          )}
          <Button type="button" variant={compact ? "outline" : "default"} size={compact ? "sm" : "lg"} className={compact ? undefined : "max-md:w-full"} onClick={() => input.current?.click()}>
            {compact ? "Agregar otro PDF" : buttonLabel}
          </Button>
          {footnote && !compact && (
            <Text size="xs" tone="muted">
              {footnote}
            </Text>
          )}
        </CardContent>
      </Card>
    </>
  );
}
