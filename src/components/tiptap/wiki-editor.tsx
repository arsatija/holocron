"use client";

import TiptapEditor from "./editor";
import { wikiMentionExtension } from "./wiki-mention";

type WikiEditorProps = {
    value?: string;
    onChange?: (html: string) => void;
    editable?: boolean;
    className?: string;
};

// Wraps the base TiptapEditor with wiki-specific extensions: @mentions and
// [[ page links. Used for both editing and read-only page rendering, so both
// paths share the same schema and parse saved content identically.
export function WikiEditor(props: WikiEditorProps) {
    return <TiptapEditor {...props} extensions={[wikiMentionExtension]} />;
}
