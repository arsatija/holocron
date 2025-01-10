"use client";

import {
    ThemeProvider as NextThemesProvider,
    type ThemeProviderProps,
} from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "./ui/toast";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider {...props}>
            <TooltipProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
            </TooltipProvider>
        </NextThemesProvider>
    );
}
