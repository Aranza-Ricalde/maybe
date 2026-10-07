"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/atoms/Alert";
import type { NotificationItem } from "@/lib/notifications";

export interface NotificationToastProps {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}

export function NotificationToast({ item, onDismiss }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.durationMs);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(500, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, item.id, onDismiss]);

  return (
    <div
      role={item.status === "danger" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto transition-all duration-300 ease-out ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
    >
      <Alert status={item.status === "default" ? undefined : item.status} title={item.title} description={item.description} onClose={() => onDismiss(item.id)} className="shadow-lg" />
    </div>
  );
}
