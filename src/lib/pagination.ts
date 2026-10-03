export type PageToken = number | "ellipsis-start" | "ellipsis-end";

export function buildPageList(current: number, total: number, siblingCount = 1): PageToken[] {
  const totalVisible = siblingCount * 2 + 5;
  if (total <= totalVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;
  const edgeCount = 3 + siblingCount * 2;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: edgeCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from({ length: edgeCount }, (_, i) => total - edgeCount + 1 + i);
    return [1, "ellipsis-start", ...rightRange];
  }
  const middle = Array.from({ length: right - left + 1 }, (_, i) => left + i);
  return [1, "ellipsis-start", ...middle, "ellipsis-end", total];
}

export function paginationRange(page: number, pageSize: number, totalItems: number): { start: number; end: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return { start, end, totalPages };
}
