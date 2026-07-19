"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { collectionFormSchema, CollectionFormValues } from "../_lib/schema";
import {
    createCollectionAction,
    updateCollectionAction,
} from "../_lib/actions";
import type { PermissionOption } from "../_lib/queries";
import { PermissionSelect } from "./permission-select";
import { EmojiPickerInput } from "./emoji-picker-input";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CollectionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: CollectionFormValues & { id: string };
    permissionOptions: PermissionOption[];
    onSuccess: (slug?: string) => void;
}

export function CollectionFormDialog({
    open,
    onOpenChange,
    defaultValues,
    permissionOptions,
    onSuccess,
}: CollectionFormDialogProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<CollectionFormValues>({
        resolver: zodResolver(collectionFormSchema),
        defaultValues: defaultValues ?? {
            name: "",
            description: "",
            icon: "",
            readPermissions: [],
            editPermissions: [],
        },
    });

    function onSubmit(values: CollectionFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateCollectionAction(defaultValues!.id, values)
                : await createCollectionAction(values);

            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Collection updated" : "Collection created");
                onSuccess((result as { slug?: string }).slug);
                onOpenChange(false);
                form.reset();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Collection" : "New Collection"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-[1fr_auto] gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Standard Operating Procedures" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="icon" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <FormControl>
                                        <EmojiPickerInput value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea rows={2} {...field} value={field.value ?? ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="readPermissions" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Who can read</FormLabel>
                                <PermissionSelect
                                    options={permissionOptions}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    placeholder="Anyone signed in"
                                />
                                <FormDescription>Leave empty to allow any logged-in member.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="editPermissions" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Who can edit</FormLabel>
                                <PermissionSelect
                                    options={permissionOptions}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    placeholder="Anyone who can read"
                                />
                                <FormDescription>Leave empty to allow anyone with read access.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
