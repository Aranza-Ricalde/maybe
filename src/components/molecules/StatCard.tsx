import { Card } from "@heroui/react";
import { StatBlock, type StatBlockProps } from "./StatBlock";

export function StatCard(props: StatBlockProps) {
  return (
    <Card className="p-5">
      <StatBlock {...props} />
    </Card>
  );
}
