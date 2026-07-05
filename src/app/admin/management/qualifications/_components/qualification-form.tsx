"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { qualificationFormSchema, QualificationFormValues, QUALIFICATION_CATEGORIES } from "../_lib/schema";
import { createQualificationAction, updateQualificationAction } from "../_lib/actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TiptapEditor from "@/components/tiptap/editor";

interface QualificationFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: QualificationFormValues & { id?: string };
    onSuccess: () => void;
}

export function QualificationForm({ open, onOpenChange, defaultValues, onSuccess }: QualificationFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<QualificationFormValues>({
        resolver: zodResolver(qualificationFormSchema),
        defaultValues: defaultValues ?? {
            name: "",
            abbreviation: "",
            category: "Standard",
            rankRequirement: "CT",
            description: "",
        },
    });

    function onSubmit(values: QualificationFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateQualificationAction(defaultValues!.id!, values)
                : await createQualificationAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Qualification updated" : "Qualification created");
                onSuccess();
                onOpenChange(false);
                form.reset();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Qualification" : "Create Qualification"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Zeus Operator" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="abbreviation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Abbreviation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ZEUS" maxLength={4} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rankRequirement"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Rank</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CT" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {QUALIFICATION_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <TiptapEditor
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            className="min-h-[160px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
