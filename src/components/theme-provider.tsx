"use client"

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { TooltipProvider } from "@/components/ui/tooltip"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider {...props}>
            <script
                type="module"
                src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/helix.js"
            ></script>
            <script
                type="module"
                src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/newtonsCradle.js"
            ></script>
            <TooltipProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
            </TooltipProvider>
        </NextThemesProvider>
    );
}