"use client";
import Loading from "@/app/loading";
import WikiEditor from "@/components/wiki/WikiEditor";
import { useWikiPage } from "@/hooks/use-wiki-page";

export default function WikiPage() {
    const { blocks, title } = useWikiPage();
    if (!blocks || !title) return <Loading />;
    return (
        <main className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold">{title}</h1>
            <div className="mx-auto -mx-[54px]">
                <WikiEditor content={blocks} />
            </div>
        </main>
    );
}
