"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import WikiRenderer from "@/components/WikiRenderer";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

export default function WikiPage() {
    const { slug } = useParams();
    const { data: page } = useSWR(
        slug ? `/api/v1/wiki/getBySlug?slug=${slug}` : null,
        fetcher
    );
    if (!page) return <p>Loading...</p>;
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-xl font-bold">{page.title}</h1>
                <Link
                    href={`/wiki/${slug}/edit`}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Edit
                </Link>
            </div>
            <WikiRenderer content={page.content} />
        </div>
    );
}
