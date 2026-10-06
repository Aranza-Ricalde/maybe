import Link from "next/link";
import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import type { ChangeExplanation, ChangeNode } from "@/domain/categoryStats/explain";
import { formatMonthYear, formatPesos } from "@/lib/format";

const signed = (cents: number) => `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${formatPesos(Math.abs(cents))}`;
const deltaClass = (cents: number) => (cents > 0 ? "text-danger" : cents < 0 ? "text-success" : "text-muted");

function NodeSummary({ node }: { node: ChangeNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{node.name}</p>
        <Text size="xs" tone="muted">
          {formatPesos(node.lastCents)} frente a {formatPesos(node.previousCents)}
        </Text>
      </div>
      <span className={`shrink-0 text-sm font-semibold tabular-nums ${deltaClass(node.deltaCents)}`}>{signed(node.deltaCents)}</span>
    </div>
  );
}

function MovementsLink({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <Link href={href} className="shrink-0 text-xs text-accent hover:underline">
      Ver movimientos →
    </Link>
  );
}

export function ChangeExplanationCard({ explanation }: { explanation: ChangeExplanation | null }) {
  if (!explanation || explanation.totalDeltaCents === 0 && explanation.nodes.length === 0) return null;
  const { totalDeltaCents } = explanation;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>¿Por qué cambió mi gasto?</Card.Title>
        <Card.Description>
          {formatMonthYear(explanation.month)} frente a {formatMonthYear(explanation.previousMonth)}: {totalDeltaCents === 0 ? (
            "gastaste lo mismo"
          ) : (
            <>
              gastaste <span className={`font-semibold ${deltaClass(totalDeltaCents)}`}>{formatPesos(Math.abs(totalDeltaCents))} {totalDeltaCents > 0 ? "más" : "menos"}</span>
            </>
          )}{" "}
          ({formatPesos(explanation.lastTotalCents)} frente a {formatPesos(explanation.previousTotalCents)}).
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <ul className="flex flex-col divide-y divide-separator">
          {explanation.nodes.map((node) => (
            <li key={`${node.categoryId ?? "agg"}-${node.name}`} className="py-2 first:pt-0 last:pb-0">
              {node.children.length > 0 ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="text-xs text-muted transition-transform group-open:rotate-90">▸</span>
                    <NodeSummary node={node} />
                    <MovementsLink href={node.href} />
                  </summary>
                  <ul className="mt-2 ml-5 flex flex-col gap-2 border-l border-separator pl-4">
                    {node.children.map((child) => (
                      <li key={`${child.categoryId ?? "agg"}-${child.name}`} className="flex items-center gap-2">
                        <NodeSummary node={child} />
                        <MovementsLink href={child.href} />
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <div className="flex items-center gap-2 pl-5">
                  <NodeSummary node={node} />
                  <MovementsLink href={node.href} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
