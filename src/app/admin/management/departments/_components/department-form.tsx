"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { departmentFormSchema, DepartmentFormValues } from "../_lib/schema";
import { createDepartmentAction, updateDepartmentAction } from "../_lib/actions";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTransition } from "react";

const SCOPES = ["Admin", "Recruitment", "Training", "Attendance", "Roster", "Qualifications", "Mod", "SGD"] as const;

interface DeptOption {
    id: string;
    name: string;
}

interface DepartmentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: DepartmentFormValues;
    deptOptions: DeptOption[];
    onSuccess: () => void;
}

export function DepartmentForm({ open, onOpenChange, defaultValues, deptOptions, onSuccess }: DepartmentFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentFormSchema),
        defaultValues: defaultValues ?? {
            name: "",
            description: "",
            icon: "/images/9_logo.png",
            parentId: null,
            priority: -1,
            departmentScopes: [],
        },
    });

    function onSubmit(values: DepartmentFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateDepartmentAction(defaultValues!.id!, values)
                : await createDepartmentAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Department updated" : "Department created");
                onSuccess();
                onOpenChange(false);
                form.reset();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Department" : "Create Department"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Operations" {...field} /></FormControl>
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
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Input placeholder="Optional description" {...field} value={field.value ?? ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="parentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent Department</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                    value={field.value ?? "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None (top-level)</SelectItem>
                                        {deptOptions
                                            .filter((d) => d.id !== defaultValues?.id)
                                            .map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="departmentScopes" render={() => (
                            <FormItem>
                                <FormLabel>Permission Scopes</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                    {SCOPES.map((scope) => (
                                        <FormField
                                            key={scope}
                                            control={form.control}
                                            name="departmentScopes"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(scope)}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value ?? [];
                                                                field.onChange(
                                                                    checked
                                                                        ? [...current, scope]
                                                                        : current.filter((s) => s !== scope)
                                                                );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">{scope}</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
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
