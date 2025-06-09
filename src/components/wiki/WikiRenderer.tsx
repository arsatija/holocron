import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./styles.css";

import { useTheme } from "next-themes";

export default function WikiRenderer({
    content,
}: {
    content: PartialBlock[] | undefined;
}) {
    const { theme } = useTheme();
    const editor = useCreateBlockNote({
        initialContent: content,
    });
    return (
        <div className="">
            <BlockNoteView
                editor={editor}
                editable={false}
                theme={theme as "light" | "dark"}
                // shadCNComponents={{
                //     Badge,
                //     Button,
                //     Card,
                //     DropdownMenu,
                //     Form,
                //     Input,
                //     Label,
                //     Popover,
                //     Select,
                //     Tabs,
                //     Toggle,
                // Tooltip,
                // }}
            />
        </div>
    );
}
