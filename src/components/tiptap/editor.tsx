"use client";

import "./tiptap.css";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { cn } from "@/lib/utils";
import Highlight from "@tiptap/extension-highlight";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { Placeholder } from "@tiptap/extensions";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";

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
                            return "Start writing...";
                    }
                },
                includeChildren: false,
            }),
            Typography,
            Image.configure({
                resize: {
                    enabled: true,
                    alwaysPreserveAspectRatio: true,
                },
            }),
            GlobalDragHandle.configure({
                dragHandleWidth: 20,
                nested: {
                    edgeDetection: {
                        threshold: 20,
                    },
                },
            }),
        ],
        content: value,
        editable,
        editorProps: {
            attributes: {
                class: className ?? "max-w-none focus:outline-none",
            },
            handlePaste(view, event) {
                const items = Array.from(event.clipboardData?.items ?? []);
                const imageItem = items.find((i) =>
                    i.type.startsWith("image/"),
                );
                if (!imageItem) return false;
                event.preventDefault();
                const file = imageItem.getAsFile();
                if (!file) return false;
                uploadToCloudinary(file).then((url) => {
                    view.dispatch(
                        view.state.tr.replaceSelectionWith(
                            view.state.schema.nodes.image.create({ src: url }),
                        ),
                    );
                });
                return true;
            },
            handleDrop(view, event) {
                const files = Array.from(event.dataTransfer?.files ?? []);
                const imageFile = files.find((f) =>
                    f.type.startsWith("image/"),
                );
                if (!imageFile) return false;
                event.preventDefault();
                uploadToCloudinary(imageFile).then((url) => {
                    const { schema } = view.state;
                    const coordinates = view.posAtCoords({
                        left: event.clientX,
                        top: event.clientY,
                    });
                    if (!coordinates) return;
                    const node = schema.nodes.image.create({ src: url });
                    const transaction = view.state.tr.insert(
                        coordinates.pos,
                        node,
                    );
                    view.dispatch(transaction);
                });
                return true;
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
                "relative w-full",
                editable
                    ? "max-h-[calc(100dvh-6rem)] overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0 rounded-md"
                    : "tiptap-readonly",
                className,
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                // Prevent Enter from submitting the form when the editor is focused
                if (e.key === "Enter" && e.target !== e.currentTarget) {
                    e.stopPropagation();
                }
            }}
        >
            {editable && <EditorToolbar editor={editor as Editor} />}
            <div className={cn(editable && "px-4 py-3")}>
                <EditorContent editor={editor as Editor} />
            </div>
        </div>
    );
};

export default TiptapEditor;
