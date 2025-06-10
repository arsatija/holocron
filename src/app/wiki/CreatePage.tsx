import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreateWikiPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const router = useRouter();

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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus /> Create New Page
                </Button>
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
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter page title"
                        />
                    </div>
                    <Button
                        onClick={handleCreatePage}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? "Creating..." : "Create Page"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
