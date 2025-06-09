"use client";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./styles.css";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function WikiEditor({
    content,
    editable = false,
    setContent,
}: {
    content: PartialBlock[] | undefined;
    editable?: boolean;
    setContent?: (content: PartialBlock[]) => void;
}) {
    const { theme } = useTheme();
    const editor = useCreateBlockNote({
        initialContent: content,
    });

    return (
        <BlockNoteView
            editor={editor}
            editable={editable}
            theme={theme as "light" | "dark"}
            onChange={() => {
                if (!setContent) return;
                setContent(editor.document);
            }}
        />
    );
}
