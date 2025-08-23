"use client";

import { ThemeProvider } from "@/lib/theme/context";
import { I18nProvider } from "@/lib/i18n/context";
import { SidebarProvider } from "@/lib/sidebar/context";
import { QueryProvider } from "@/lib/query/client";
import { PWAProvider } from "@/components/pwa/pwa-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SidebarProvider>
          <QueryProvider>
            <PWAProvider>
              {children}
            </PWAProvider>
          </QueryProvider>
        </SidebarProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}