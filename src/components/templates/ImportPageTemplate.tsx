"use client";

import { Card } from "@heroui/react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { Text } from "@/components/atoms/Text";
import { EnableNotificationsButton } from "@/components/molecules/EnableNotificationsButton";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatementReview } from "@/components/organisms/StatementReview";
import { useStatementImport } from "@/components/organisms/StatementImportProvider";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { STATEMENT_BANKS, STATEMENT_BANK_LABELS, type StatementBank } from "@/domain/statements/types";
import { STATUS_LABEL } from "@/lib/statementQueue";

export interface ImportPageTemplateProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function ImportPageTemplate({ accounts, categories }: ImportPageTemplateProps) {
  const { items, dispatch, addFiles } = useStatementImport();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const pending = items.filter((item) => item.status === "configuring" || item.status === "error" || item.status === "password");
  const reviewable = items.filter((item) => item.status === "ready" || item.status === "confirming");
  const finished = items.filter((item) => item.status === "done");

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files).filter((file) => file.type === "application/pdf"));
  };

  return (
    <>
      <PageHeader title="Importar estados de cuenta" subtitle="Trae tus movimientos desde el PDF del banco sin capturarlos a mano." action={<EnableNotificationsButton />} />
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        data-testid="statement-file-input"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <Card
        className={`flex flex-col items-center gap-3 border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-accent bg-accent-soft/40" : "border-separator"}`}
        onDragOver={(event: DragEvent) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Text weight="medium">Arrastra aquí tus estados de cuenta en PDF</Text>
        <Text size="sm" tone="muted">
          Puedes subir varios a la vez · máximo 4 MB cada uno · Nu débito, Nu crédito y BBVA
        </Text>
        <Button onPress={() => input.current?.click()}>Elegir PDFs</Button>
        <Text size="xs" tone="muted">
          El PDF se lee en memoria y no se guarda. Solo se registran los movimientos que confirmes.
        </Text>
      </Card>

      {items.length === 0 && (
        <ol className="grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["1", "Elige banco y cuenta", "Dinos de qué banco es cada PDF y a qué cuenta de la app pertenece."],
            ["2", "Revisa", "Comparamos con lo que ya registraste para no duplicar. Tú decides qué se importa."],
            ["3", "Confirma", "Se crean los movimientos nuevos y se vinculan los que ya tenías."],
          ].map(([number, title, text]) => (
            <li key={number} className="flex gap-3 rounded-xl border border-separator p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{number}</span>
              <span>
                <Text weight="medium" size="sm">
                  {title}
                </Text>
                <Text size="xs" tone="muted">
                  {text}
                </Text>
              </span>
            </li>
          ))}
        </ol>
      )}

      {pending.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <Text weight="medium">Paso 1 · Indica banco y cuenta de cada archivo</Text>
          {pending.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-separator pb-3 last:border-0">
              <span className="min-w-0 flex-1 truncate text-sm">{item.file.name}</span>
              <Select uiSize="sm" aria-label={`Banco de ${item.file.name}`} value={item.bank ?? ""} onChange={(e) => dispatch({ type: "configure", id: item.id, bank: (e.target.value || null) as StatementBank | null })}>
                <option value="">¿De qué banco es?</option>
                {STATEMENT_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {STATEMENT_BANK_LABELS[bank]}
                  </option>
                ))}
              </Select>
              <Select uiSize="sm" aria-label={`Cuenta de ${item.file.name}`} value={item.accountId ?? ""} onChange={(e) => dispatch({ type: "configure", id: item.id, accountId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">¿A qué cuenta va?</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
              {item.status === "password" && <input type="password" aria-label="Contraseña del PDF" placeholder="Contraseña" className="h-8 rounded-field border border-separator bg-field px-2 text-xs" value={item.password} onChange={(e) => dispatch({ type: "configure", id: item.id, password: e.target.value })} />}
              {item.status !== "configuring" && (
                <Button size="sm" isDisabled={item.bank === null || item.accountId === null} onPress={() => dispatch({ type: "enqueue", id: item.id })}>
                  Reintentar
                </Button>
              )}
              <Button size="sm" variant="ghost" onPress={() => dispatch({ type: "remove", id: item.id })}>
                Quitar
              </Button>
              {item.message && (
                <Text size="xs" tone="danger" className="w-full">
                  {STATUS_LABEL[item.status]}: {item.message}
                </Text>
              )}
            </div>
          ))}
          <Text size="xs" tone="muted">
            Al elegir banco y cuenta, el estado se empieza a leer solo.
          </Text>
        </Card>
      )}

      {reviewable.map((item) => (
        <StatementReview key={item.id} item={item} categories={categories} />
      ))}

      {finished.map((item) => (
        <Card key={item.id} className="p-4">
          <Text size="sm">
            <span className="font-medium">{item.file.name}</span>: {item.result?.imported} importados, {item.result?.linked} vinculados, {item.result?.skipped} omitidos
            {item.result && item.result.paired > 0 ? `, ${item.result.paired} emparejados` : ""}.
          </Text>
        </Card>
      ))}
    </>
  );
}
