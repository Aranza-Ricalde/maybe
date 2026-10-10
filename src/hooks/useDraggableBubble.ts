"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { clampPosition, movedBeyondThreshold, snapToSide, type Point, type Size } from "@/lib/presenters/dragPosition";

const MARGIN = 8;
const SETTLE_MS = 240;
const SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

let rememberedPosition: Point | null = null;

interface DragState {
  pointerStart: Point;
  origin: Point;
  current: Point;
  moved: boolean;
}

export function useDraggableBubble(size: Size, onTap: () => void) {
  const element = useRef<HTMLButtonElement>(null);
  const drag = useRef<DragState | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<Point | null>(rememberedPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  const onPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (settleTimer.current) clearTimeout(settleTimer.current);
    event.currentTarget.style.transition = "none";
    drag.current = { pointerStart: { x: event.clientX, y: event.clientY }, origin: { x: rect.left, y: rect.top }, current: { x: rect.left, y: rect.top }, moved: false };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const state = drag.current;
      if (!state) return;
      const point = { x: event.clientX, y: event.clientY };
      if (!state.moved) {
        if (!movedBeyondThreshold(state.pointerStart, point)) return;
        state.moved = true;
        setIsDragging(true);
      }
      state.current = clampPosition({ x: state.origin.x + point.x - state.pointerStart.x, y: state.origin.y + point.y - state.pointerStart.y }, viewport(), size, MARGIN);
      event.currentTarget.style.transform = `translate3d(${state.current.x - state.origin.x}px, ${state.current.y - state.origin.y}px, 0) scale(1.1)`;
    },
    [size],
  );

  const finish = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const state = drag.current;
      drag.current = null;
      const target = event.currentTarget;
      if (!state) return;
      if (!state.moved) {
        onTap();
        return;
      }
      const snapped = snapToSide(state.current, viewport(), size, MARGIN);
      target.style.transition = `transform ${SETTLE_MS}ms ${SETTLE_EASING}`;
      target.style.transform = `translate3d(${snapped.x - state.origin.x}px, ${snapped.y - state.origin.y}px, 0) scale(1)`;
      setIsDragging(false);
      settleTimer.current = setTimeout(() => {
        rememberedPosition = snapped;
        setPosition(snapped);
        const node = element.current;
        if (node) {
          node.style.transition = "none";
          node.style.transform = "";
        }
      }, SETTLE_MS + 30);
    },
    [onTap, size],
  );

  return { element, position, isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish } };
}
