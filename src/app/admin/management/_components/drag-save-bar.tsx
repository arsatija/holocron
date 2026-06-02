"use client";

import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragSaveBarProps {
    isDirty: boolean;
    isPending: boolean;
    onSave: () => void;
    onDiscard: () => void;
}

export function DragSaveBar({ isDirty, isPending, onSave, onDiscard }: DragSaveBarProps) {
    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border bg-background shadow-lg px-4 py-3 transition-all duration-200",
                isDirty
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-4 opacity-0 pointer-events-none"
            )}
        >
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
            <Button
                size="sm"
                variant="ghost"
                onClick={onDiscard}
                disabled={isPending}
                className="h-8 px-3 gap-1.5"
            >
                <X className="h-3.5 w-3.5" />
                Discard
            </Button>
            <Button
                size="sm"
                onClick={onSave}
                disabled={isPending}
                className="h-8 px-3 gap-1.5"
            >
                <Save className="h-3.5 w-3.5" />
                {isPending ? "Saving…" : "Save changes"}
            </Button>
        </div>
    );
}
