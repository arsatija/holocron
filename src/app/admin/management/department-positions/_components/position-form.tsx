"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { departmentPositionFormSchema, DepartmentPositionFormValues } from "../_lib/schema";
import { createDepartmentPositionAction, updateDepartmentPositionAction } from "../_lib/actions";
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

interface DeptOption {
    id: string;
    name: string;
}

interface PositionOption {
    id: string;
    role: string;
    departmentId: string;
}

interface PositionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: DepartmentPositionFormValues;
    deptOptions: DeptOption[];
    positionOptions: PositionOption[];
    prefilledDeptId?: string;
    onSuccess: () => void;
}

export function PositionForm({
    open,
    onOpenChange,
    defaultValues,
    deptOptions,
    positionOptions,
    prefilledDeptId,
    onSuccess,
}: PositionFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<DepartmentPositionFormValues>({
        resolver: zodResolver(departmentPositionFormSchema),
        defaultValues: defaultValues ?? {
            role: "",
            slug: "",
            departmentId: prefilledDeptId ?? "",
            superiorPositionId: null,
            priority: -1,
        },
    });

    const watchedDeptId = form.watch("departmentId");
    const filteredPositions = positionOptions.filter(
        (p) => p.departmentId === watchedDeptId && p.id !== defaultValues?.id
    );

    function onSubmit(values: DepartmentPositionFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateDepartmentPositionAction(defaultValues!.id!, values)
                : await createDepartmentPositionAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Position updated" : "Position created");
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
                    <DialogTitle>{isEdit ? "Edit Position" : "Create Position"}</DialogTitle>
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
                                    <FormControl><Input placeholder="dept:lead" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="departmentId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue("superiorPositionId", null); }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {deptOptions.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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
                        <FormField control={form.control} name="superiorPositionId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Superior Position</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                    value={field.value ?? "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {filteredPositions.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.role}</SelectItem>
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
