"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WikiEditor from "@/components/wiki/WikiEditor";
import { useWikiPage } from "@/hooks/use-wiki-page";
import Loading from "@/app/loading";

export default function EditWikiPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { blocks, setBlocks, title, setTitle } = useWikiPage();

    if (!blocks || !title) return <Loading />;
    
    if (!session?.user) return <p>You must be logged in to edit pages.</p>;


    const save = async () => {
        await fetch("/api/v1/wiki/updatePage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug,
                title,
                content: JSON.stringify(blocks),
            }),
        });
        router.push(`/wiki/${slug}`);
    };

    return (
        <main className="mx-auto max-w-3xl">
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-6 font-bold h-14 text-4xl border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 md:text-4xl"
                placeholder="Page Title"
            />
            <div className="mx-auto -mx-[54px]">
                <WikiEditor content={blocks} setContent={setBlocks} editable />
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={save}>Save Changes</Button>
            </div>
        </main>
    );
}
