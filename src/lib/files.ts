export function filterByMime(files: File[], mime: string): File[] {
  return files.filter((file) => file.type === mime);
}
