"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitElementFormSchema, UnitElementFormValues } from "../_lib/schema";
import { createUnitElementAction, updateUnitElementAction } from "../_lib/actions";
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
import { useTransition } from "react";

interface ElementOption {
    id: string;
    name: string;
}

interface UnitElementFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: UnitElementFormValues;
    elementOptions: ElementOption[];
    onSuccess: () => void;
}

export function UnitElementForm({ open, onOpenChange, defaultValues, elementOptions, onSuccess }: UnitElementFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<UnitElementFormValues>({
        resolver: zodResolver(unitElementFormSchema),
        defaultValues: defaultValues ?? {
            name: "",
            icon: "/images/9_logo.png",
            parentId: null,
            priority: -1,
            radio: "",
        },
    });

    function onSubmit(values: UnitElementFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateUnitElementAction(defaultValues!.id!, values)
                : await createUnitElementAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Unit element updated" : "Unit element created");
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
                    <DialogTitle>{isEdit ? "Edit Unit Element" : "Create Unit Element"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Alpha Company" {...field} /></FormControl>
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
                        <FormField control={form.control} name="radio" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Radio</FormLabel>
                                <FormControl><Input placeholder="Optional" {...field} value={field.value ?? ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="parentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent Element</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                    value={field.value ?? "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None (top-level)</SelectItem>
                                        {elementOptions
                                            .filter((e) => e.id !== defaultValues?.id)
                                            .map((e) => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
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
