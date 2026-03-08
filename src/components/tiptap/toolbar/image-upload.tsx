"use client";

import React, { useRef, useTransition } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToolbar } from "./toolbar-provider";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";

const ImageUploadToolbar = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
    const { editor } = useToolbar();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are supported");
            return;
        }
        startTransition(async () => {
            try {
                const url = await uploadToCloudinary(file);
                editor.chain().focus().setImage({ src: url }).run();
            } catch {
                toast.error("Failed to upload image");
            }
        });
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                }}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        ref={ref}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        disabled={isPending}
                        onClick={() => inputRef.current?.click()}
                        {...props}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImageIcon className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Insert image</span>
                </TooltipContent>
            </Tooltip>
        </>
    );
});

ImageUploadToolbar.displayName = "ImageUploadToolbar";

export { ImageUploadToolbar };
