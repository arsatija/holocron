"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rankFormSchema, RankFormValues } from "../_lib/schema";
import { createRankAction, updateRankAction } from "../_lib/actions";
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

const RANK_LEVELS = ["Enlisted", "JNCO", "SNCO", "Company", "Command"] as const;

interface RankOption {
    id: number;
    name: string | null;
}

interface RankFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: RankFormValues & { id?: number };
    rankOptions: RankOption[];
    onSuccess: () => void;
}

export function RankForm({ open, onOpenChange, defaultValues, rankOptions, onSuccess }: RankFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<RankFormValues>({
        resolver: zodResolver(rankFormSchema),
        defaultValues: defaultValues ?? {
            grade: "",
            name: "",
            abbreviation: "",
            rankLevel: "Enlisted",
            order: undefined,
            nextRankId: undefined,
        },
    });

    function onSubmit(values: RankFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateRankAction(defaultValues!.id!, values)
                : await createRankAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Rank updated" : "Rank created");
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
                    <DialogTitle>{isEdit ? "Edit Rank" : "Create Rank"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Private" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="abbreviation" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Abbreviation</FormLabel>
                                    <FormControl><Input placeholder="Pvt" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="grade" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Grade</FormLabel>
                                    <FormControl><Input placeholder="E-1" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="order" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order</FormLabel>
                                    <FormControl><Input type="number" placeholder="1" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="rankLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rank Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {RANK_LEVELS.map((level) => (
                                            <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="nextRankId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Next Rank</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                                    value={field.value != null ? String(field.value) : "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {rankOptions
                                            .filter((r) => r.id !== defaultValues?.id)
                                            .map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
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
