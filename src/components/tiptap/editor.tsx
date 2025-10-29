"use client";

import "./tiptap.css";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extensions";
import { TipTapFloatingMenu } from "./extensions/command-blocks";

type TiptapProps = {
    value?: string;
    onChange?: (html: string) => void;
    editable?: boolean;
    className?: string;
};

const TiptapEditor = ({
    value = "",
    onChange,
    editable = true,
    className,
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
            Placeholder.configure({
                emptyNodeClass: "is-editor-empty",
                placeholder: ({ node }) => {
                    switch (node.type.name) {
                        case "heading":
                            return `Heading ${node.attrs.level}`;
                        case "detailsSummary":
                            return "Section title";
                        case "codeBlock":
                            // never show the placeholder when editing code
                            return "";
                        default:
                            return "Write, type '/' for commands";
                    }
                },
                includeChildren: false,
            }),
            Typography,
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
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
    });

    // Update editor content when value changes externally
    useEffect(() => {
        if (!editor || !onChange) return;

        const currentContent = editor.getHTML();
        if (value !== currentContent) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor, onChange]);

    // Toggle editability
    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!!editable);
    }, [editable, editor]);

    if (!editor) return null;
    return (
        <div
            className={cn(
                "relative max-h-[calc(100dvh-6rem)]  w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0 rounded-md",
                className
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                // Prevent Enter from submitting the form when the editor is focused
                if (e.key === "Enter" && e.target !== e.currentTarget) {
                    e.stopPropagation();
                }
            }}
        >
            {editable && (
                <>
                    <EditorToolbar editor={editor as Editor} />
                    <TipTapFloatingMenu editor={editor as Editor} />
                </>
            )}
            <EditorContent className="py-2 px-3" editor={editor as Editor} />
        </div>
    );
};

export default TiptapEditor;
