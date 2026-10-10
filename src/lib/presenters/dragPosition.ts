export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export const DRAG_THRESHOLD_PX = 5;

export function clampPosition(position: Point, viewport: Size, element: Size, margin: number): Point {
  const maxX = Math.max(margin, viewport.width - element.width - margin);
  const maxY = Math.max(margin, viewport.height - element.height - margin);
  return { x: Math.min(Math.max(position.x, margin), maxX), y: Math.min(Math.max(position.y, margin), maxY) };
}

export function movedBeyondThreshold(start: Point, current: Point, threshold: number = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}

export function snapToSide(position: Point, viewport: Size, element: Size, margin: number): Point {
  const clamped = clampPosition(position, viewport, element, margin);
  const center = clamped.x + element.width / 2;
  const x = center < viewport.width / 2 ? margin : viewport.width - element.width - margin;
  return { x, y: clamped.y };
}
