"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { clampPosition, movedBeyondThreshold, snapToSide, type Point, type Size } from "@/lib/presenters/dragPosition";

const MARGIN = 8;

export function useDraggableBubble(size: Size, onTap: () => void) {
  const [position, setPosition] = useState<Point | null>(null);
  const drag = useRef<{ pointerStart: Point; origin: Point; moved: boolean } | null>(null);

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      drag.current = { pointerStart: { x: event.clientX, y: event.clientY }, origin: { x: rect.left, y: rect.top }, moved: false };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        return;
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const current = drag.current;
      if (!current) return;
      const point = { x: event.clientX, y: event.clientY };
      if (!current.moved && !movedBeyondThreshold(current.pointerStart, point)) return;
      current.moved = true;
      setPosition(clampPosition({ x: current.origin.x + point.x - current.pointerStart.x, y: current.origin.y + point.y - current.pointerStart.y }, viewport(), size, MARGIN));
    },
    [size],
  );

  const onPointerUp = useCallback(() => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (!current.moved) {
      onTap();
      return;
    }
    setPosition((released) => (released ? snapToSide(released, viewport(), size, MARGIN) : released));
  }, [onTap, size]);

  return { position, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}
