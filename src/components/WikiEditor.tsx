import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/react";

interface WikiEditorProps {
    content: JSONContent;
    onChange: (content: JSONContent) => void;
}

export default function WikiEditor({ content, onChange }: WikiEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content,
        onUpdate: ({ editor }) => onChange(editor.getJSON()),
    });

    return <EditorContent editor={editor} />;
}
