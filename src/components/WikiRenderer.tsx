import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function WikiRenderer({ content }: { content: JSONContent }) {
    const editor = useEditor({
        extensions: [StarterKit],
        content,
        editable: false,
    });
    return <EditorContent editor={editor} />;
}
