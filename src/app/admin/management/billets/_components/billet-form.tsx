"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billetFormSchema, BilletFormValues } from "../_lib/schema";
import { createBilletAction, updateBilletAction } from "../_lib/actions";
import { toast } from "sonner";
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
import { useEffect, useTransition } from "react";

interface UnitElementOption {
    id: string;
    name: string;
}

interface BilletOption {
    id: string;
    role: string;
    unitElementId: string | null;
}

interface BilletFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: BilletFormValues;
    unitElementOptions: UnitElementOption[];
    billetOptions: BilletOption[];
    prefilledUnitElementId?: string;
    onSuccess: () => void;
}

export function BilletForm({
    open,
    onOpenChange,
    defaultValues,
    unitElementOptions,
    billetOptions,
    prefilledUnitElementId,
    onSuccess,
}: BilletFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<BilletFormValues>({
        resolver: zodResolver(billetFormSchema),
        defaultValues: defaultValues ?? {
            role: "",
            slug: "",
            unitElementId: prefilledUnitElementId ?? "",
            superiorBilletId: null,
            priority: -1,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(defaultValues ?? {
                role: "",
                slug: "",
                unitElementId: prefilledUnitElementId ?? "",
                superiorBilletId: null,
                priority: -1,
            });
        }
    }, [open, defaultValues]);

    const watchedUnitElementId = form.watch("unitElementId");
    const filteredBillets = billetOptions.filter(
        (b) => b.unitElementId === watchedUnitElementId && b.id !== defaultValues?.id
    );

    function onSubmit(values: BilletFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateBilletAction(defaultValues!.id!, values)
                : await createBilletAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Billet updated" : "Billet created");
                onSuccess();
                onOpenChange(false);
                form.reset();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Billet" : "Create Billet"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl><Input placeholder="Commander" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="slug" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl><Input placeholder="unit:co" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="unitElementId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit Element</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue("superiorBilletId", null); }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {unitElementOptions.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="priority" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="superiorBilletId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Superior Billet</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                    value={field.value ?? "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {filteredBillets.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>{b.role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
