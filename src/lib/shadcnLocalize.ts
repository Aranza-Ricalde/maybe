const BROKEN_UTILS_IMPORT = /from "cn"/g;

export function localizeShadcnClasses(source: string): string {
  return source.replace(BROKEN_UTILS_IMPORT, 'from "@/lib/utils"');
}
