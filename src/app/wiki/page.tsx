"use client";

import { WikiPage } from "@/db/schema";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Loading from "../loading";

export default function WikiListPage() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        data: pages,
        isLoading,
        mutate,
    } = useSWR<WikiPage[]>("/api/v1/wiki/getAllPages", fetcher);

    const handleCreatePage = async () => {
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/v1/wiki/createPage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title }),
            });

            if (!response.ok) {
                throw new Error("Failed to create page");
            }

            const newPage = await response.json();
            await mutate(); // Refresh the pages list
            setIsOpen(false);
            setTitle("");
            router.push(`/wiki/${newPage.slug}`);
            toast.success("Page created successfully");
        } catch (error) {
            console.error("Error creating page:", error);
            toast.error("Failed to create page");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <>
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Wiki Pages</h1>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>Create New Page</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Wiki Page</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Page Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="Enter page title"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreatePage}
                                    disabled={isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting
                                        ? "Creating..."
                                        : "Create Page"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <ul className="space-y-2">
                    {pages?.map((page) => (
                        <li key={page.id}>
                            <Link
                                href={`/wiki/${page.slug}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {page.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
