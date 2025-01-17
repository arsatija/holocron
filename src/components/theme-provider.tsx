"use client";

import {
    ThemeProvider as NextThemesProvider,
    type ThemeProviderProps,
} from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SessionProvider } from "next-auth/react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider {...props}>
            <SessionProvider>
            <TooltipProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
            </TooltipProvider>
            </SessionProvider>
        </NextThemesProvider>
    );
}
