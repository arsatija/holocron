"use client";

import "./tiptap.css";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";

type TiptapProps = {
    value?: string;
    editable?: boolean;
    className?: string;
    placeholder?: string;
};

const Tiptap = ({
    value = "",
    editable = true,
    className,
    placeholder,
}: TiptapProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            Highlight.configure({ multicolor: true }),
            TextStyleKit,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
        ],
        content: value,
        editable,
        editorProps: {
            attributes: {
                class: className ?? "max-w-none focus:outline-none",
            },
        },
        // Avoid SSR hydration mismatches
        immediatelyRender: false,
    });

    if (!editor) return null;
    return (
        <div
            className={cn(
                "relative max-h-[calc(100dvh-6rem)]  w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0 rounded-md",
                className
            )}
        >
            {editable && <EditorToolbar editor={editor as Editor} />}
            <EditorContent className="py-2 px-3" editor={editor as Editor} />
        </div>
    );
};

export default Tiptap;
