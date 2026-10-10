import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ACCENT_COOKIE, normalizeAccent } from "@/lib/accent";
import { RESOLVED_THEME_COOKIE, THEME_COOKIE, initialThemeAttribute } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maybe",
  description: "Finanzas personales",
  appleWebApp: { capable: true, title: "Maybe", statusBarStyle: "default" },
  icons: { apple: "/api/icons/180" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0f766e" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = initialThemeAttribute(cookieStore.get(THEME_COOKIE)?.value, cookieStore.get(RESOLVED_THEME_COOKIE)?.value);

  const accent = normalizeAccent(cookieStore.get(ACCENT_COOKIE)?.value);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme={theme}
      data-accent={accent}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
