"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import WikiEditor from "@/components/WikiEditor";

export default function EditWikiPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [existing, setExisting] = useState<any>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState({});

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/wiki/getBySlug?slug=${slug}`)
            .then((res) => res.json())
            .then((data) => {
                setExisting(data);
                setTitle(data.title);
                setContent(data.content);
            });
    }, [slug]);

    if (!session?.user) return <p>You must be logged in to edit pages.</p>;

    const save = async () => {
        await fetch("/api/v1/wiki/updatePage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, title, content }),
        });
        router.push(`/wiki/${slug}`);
    };

    return (
        <div>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border px-2 py-1 mb-2 w-full"
            />
            <WikiEditor content={content} onChange={setContent} />
            <button
                onClick={save}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
                Save
            </button>
        </div>
    );
}
