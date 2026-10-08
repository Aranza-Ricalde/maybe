"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { ReviewAlert } from "./ReviewAlert";

export interface ReviewQueueBannerProps<T> {
  items: T[];
  ariaLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  getKey: (item: T, index: number) => string | number;
  renderHeadline: (item: T, total: number) => ReactNode;
  renderActions: (item: T) => ReactNode;
  renderDetails?: (item: T, total: number) => ReactNode;
}

export function ReviewQueueBanner<T>({ items, ariaLabel, icon, getKey, renderHeadline, renderActions, renderDetails }: ReviewQueueBannerProps<T>) {
  const { item, position } = useReviewQueue(items);
  if (item === null) return null;
  const key = getKey(item, position.current);

  return (
    <ReviewAlert
      ariaLabel={ariaLabel}
      icon={icon}
      itemKey={key}
      position={position}
      actions={<div key={key}>{renderActions(item)}</div>}
      details={renderDetails?.(item, position.total)}
    >
      {renderHeadline(item, position.total)}
    </ReviewAlert>
  );
}
