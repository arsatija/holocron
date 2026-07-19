"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Client-only + code-split: the picker bundles a large emoji dataset that
// shouldn't ship in the main page bundle or be part of SSR.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiPickerInputProps {
    value?: string | null;
    onChange: (emoji: string) => void;
}

export function EmojiPickerInput({ value, onChange }: EmojiPickerInputProps) {
    const [open, setOpen] = useState(false);
    const { resolvedTheme } = useTheme();

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 shrink-0 p-0 text-lg"
                >
                    {value || "🙂"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <EmojiPicker
                    onEmojiClick={(emojiData) => {
                        onChange(emojiData.emoji);
                        setOpen(false);
                    }}
                    theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                    width={320}
                    height={380}
                />
            </PopoverContent>
        </Popover>
    );
}
