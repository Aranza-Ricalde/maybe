"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CalendarEntry } from "@/domain/calendar/rules";
import { groupCalendarEntriesByStatus } from "@/domain/calendar/rules";
import { ROUTES, searchTransactionsHref } from "@/domain/shared/routes";
import { useStatementImport } from "@/providers/StatementImportProvider";

export function useDashboardShortcuts(entries: CalendarEntry[]) {
  const router = useRouter();
  const { addFiles } = useStatementImport();
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const openPayments = groupCalendarEntriesByStatus(entries).pending;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(false);
    router.push(searchTransactionsHref(query));
  }

  function pickStatements(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    addFiles(files);
    router.push(ROUTES.import);
  }

  return {
    fileInput,
    openFilePicker: () => fileInput.current?.click(),
    pickStatements,
    query,
    setQuery,
    isSearching,
    setIsSearching,
    submitSearch,
    openPayments,
  };
}
