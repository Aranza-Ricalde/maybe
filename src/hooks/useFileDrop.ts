import { useState, type DragEvent } from "react";
import { filterByMime } from "@/lib/files";

export function useFileDrop(accept: string, onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);

  return {
    dragging,
    dropProps: {
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        onFiles(filterByMime(Array.from(event.dataTransfer.files), accept));
      },
    },
  };
}
