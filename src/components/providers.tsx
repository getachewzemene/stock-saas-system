"use client";

import { ThemeProvider } from "@/lib/theme/context";
import { I18nProvider } from "@/lib/i18n/context";
import { SidebarProvider } from "@/lib/sidebar/context";
import { QueryProvider } from "@/lib/query/client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SidebarProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SidebarProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}