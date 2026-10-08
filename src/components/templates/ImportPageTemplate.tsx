"use client";

import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemGroup, ItemSeparator } from "@/components/ui/item";
import { StepList } from "@/components/molecules/StepList";
import { ImportResultAlert } from "@/components/organisms/ImportResultAlert";
import { PendingStatementRow } from "@/components/organisms/PendingStatementRow";
import { EnableNotificationsButton } from "@/components/molecules/EnableNotificationsButton";
import { FileDropzone } from "@/components/molecules/FileDropzone";
import { PageHeader } from "@/components/molecules/PageHeader";
import { StatementReview } from "@/components/organisms/StatementReview";
import { useStatementImport } from "@/providers/StatementImportProvider";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { currentImportStep, groupQueue } from "@/lib/statementQueue";

const IMPORT_STEPS = [
  { title: "Elige banco y cuenta", description: "Dinos de qué banco es cada PDF y a qué cuenta de la app pertenece." },
  { title: "Revisa", description: "Comparamos con lo que ya registraste para no duplicar. Tú decides qué se importa." },
  { title: "Confirma", description: "Se crean los movimientos nuevos y se vinculan los que ya tenías." },
];

export interface ImportPageTemplateProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function ImportPageTemplate({ accounts, categories }: ImportPageTemplateProps) {
  const { items, dispatch, addFiles } = useStatementImport();
  const grouped = groupQueue(items);
  const { pending, reviewable, finished } = grouped;

  return (
    <>
      <PageHeader title="Importar estados de cuenta" subtitle="Trae tus movimientos desde el PDF del banco sin capturarlos a mano." action={<EnableNotificationsButton />} />
      <FileDropzone
        accept="application/pdf"
        title="Arrastra aquí tus estados de cuenta en PDF"
        hint="Puedes subir varios a la vez · máximo 4 MB cada uno · Nu débito, Nu crédito y BBVA"
        buttonLabel="Elegir PDFs"
        footnote="El PDF se lee en memoria y no se guarda. Solo se registran los movimientos que confirmes."
        inputTestId="statement-file-input"
        compact={items.length > 0}
        onFiles={addFiles}
      />

      <StepList steps={IMPORT_STEPS} current={currentImportStep(grouped)} />

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1 · Indica banco y cuenta de cada archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {pending.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 && <ItemSeparator />}
                  <PendingStatementRow
                    item={item}
                    accounts={accounts}
                    onConfigure={(change) => dispatch({ type: "configure", id: item.id, ...change })}
                    onRetry={() => dispatch({ type: "enqueue", id: item.id })}
                    onRemove={() => dispatch({ type: "remove", id: item.id })}
                  />
                </Fragment>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}

      {reviewable.map((item) => (
        <StatementReview key={item.id} item={item} categories={categories} />
      ))}

      {finished.map((item) => (
        <ImportResultAlert key={item.id} fileName={item.file.name} result={item.result} />
      ))}
    </>
  );
}
