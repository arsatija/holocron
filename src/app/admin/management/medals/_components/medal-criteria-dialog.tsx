"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Trash2 } from "lucide-react";
import {
    medalCriteriaFormSchema,
    medalCriteriaTypes,
    zeusRoles,
    criteriaEventTypes,
    MedalCriteriaFormValues,
} from "../_lib/schema";
import {
    getCriteriaForMedalAction,
    addMedalCriteriaAction,
    deleteMedalCriteriaAction,
} from "../_lib/actions";
import { getQualificationOptions } from "@/services/qualifications";
import { getMedals } from "@/services/medals";

type Medal = { id: string; name: string };

type CriteriaRow = {
    id: string;
    criteriaType: (typeof medalCriteriaTypes)[number];
    threshold: number | null;
    zeusRole: (typeof zeusRoles)[number] | null;
    eventType: (typeof criteriaEventTypes)[number] | null;
    ruleGroup: number;
    qualification: { id: string; name: string; abbreviation: string } | null;
    requiredMedal: { id: string; name: string } | null;
};

type QualificationOption = { id: string; name: string; abbreviation: string };

const NEEDS_THRESHOLD: Record<string, boolean> = {
    ZeusCount: true,
    ReferralCount: true,
    TrainingCompletionCount: true,
    AttendanceCount: true,
    TenureDays: true,
    Qualification: false,
    HasMedal: false,
};

const TYPE_LABELS: Record<string, string> = {
    Qualification: "Has qualification",
    ZeusCount: "Zeus/CoZeus count \u2265",
    ReferralCount: "Referral count \u2265",
    TrainingCompletionCount: "Training completions submitted \u2265",
    AttendanceCount: "Attendance count \u2265",
    TenureDays: "Days in unit \u2265",
    HasMedal: "Already has medal",
};

function describeCriterion(row: CriteriaRow) {
    if (row.criteriaType === "Qualification") {
        return `Has qualification: ${row.qualification?.name ?? "Unknown"}`;
    }
    if (row.criteriaType === "HasMedal") {
        return `Already has medal: ${row.requiredMedal?.name ?? "Unknown"}`;
    }
    if (row.criteriaType === "ZeusCount") {
        const role = row.zeusRole ?? "Either";
        const eventLabel = row.eventType ?? "any operation type";
        return `${role} count \u2265 ${row.threshold} (${eventLabel})`;
    }
    return `${TYPE_LABELS[row.criteriaType]} ${row.threshold}`;
}

interface MedalCriteriaDialogProps {
    medal: Medal;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MedalCriteriaDialog({
    medal,
    open,
    onOpenChange,
}: MedalCriteriaDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [rows, setRows] = useState<CriteriaRow[]>([]);
    const [qualifications, setQualifications] = useState<QualificationOption[]>([]);
    const [allMedals, setAllMedals] = useState<Medal[]>([]);
    const [loading, setLoading] = useState(true);

    const form = useForm<MedalCriteriaFormValues>({
        resolver: zodResolver(medalCriteriaFormSchema),
        defaultValues: {
            criteriaType: "AttendanceCount",
            qualificationId: null,
            requiredMedalId: null,
            threshold: 1,
            zeusRole: "Either",
            eventType: null,
            ruleGroup: 1,
        },
    });

    const selectedType = form.watch("criteriaType");

    async function refresh() {
        setLoading(true);
        const [criteriaResult, qualOptions, medalOptions] = await Promise.all([
            getCriteriaForMedalAction(medal.id),
            getQualificationOptions(),
            getMedals(),
        ]);
        setRows(criteriaResult as CriteriaRow[]);
        setQualifications(qualOptions);
        setAllMedals(medalOptions.filter((m) => m.id !== medal.id));
        setLoading(false);
    }

    useEffect(() => {
        if (open) {
            refresh();
        }
    }, [open, medal.id]);

    function onSubmit(values: MedalCriteriaFormValues) {
        startTransition(async () => {
            const result = await addMedalCriteriaAction(medal.id, values);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Criteria added");
                form.reset({
                    criteriaType: "AttendanceCount",
                    qualificationId: null,
                    requiredMedalId: null,
                    threshold: 1,
                    zeusRole: "Either",
                    eventType: null,
                    ruleGroup: form.getValues("ruleGroup"),
                });
                refresh();
            }
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            const result = await deleteMedalCriteriaAction(id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Criteria removed");
                refresh();
            }
        });
    }

    const groupedRows = rows.reduce<Record<number, CriteriaRow[]>>((acc, row) => {
        acc[row.ruleGroup] = acc[row.ruleGroup] ?? [];
        acc[row.ruleGroup].push(row);
        return acc;
    }, {});
    const groupNumbers = Object.keys(groupedRows)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Criteria for &ldquo;{medal.name}&rdquo;</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Rules in the <strong>same group</strong> must ALL be met (AND).
                    A trooper earns the medal if they satisfy <strong>any one group</strong> (OR).
                </p>

                <div className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No criteria yet — add one below.
                        </p>
                    ) : (
                        groupNumbers.map((groupNum, idx) => (
                            <div key={groupNum}>
                                {idx > 0 && (
                                    <p className="text-xs font-semibold text-muted-foreground text-center py-1">
                                        — OR —
                                    </p>
                                )}
                                <div className="rounded-md border p-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Group {groupNum}
                                    </p>
                                    {groupedRows[groupNum].map((row) => (
                                        <div
                                            key={row.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span>{describeCriterion(row)}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(row.id)}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-3 border-t pt-3"
                    >
                        <FormField
                            control={form.control}
                            name="ruleGroup"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rule group</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            {...field}
                                            value={field.value ?? 1}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Use the same group number to require multiple rules
                                        together. Use a new number to add an alternative (OR) path.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="criteriaType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rule type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {medalCriteriaTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {TYPE_LABELS[type]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedType === "Qualification" && (
                            <FormField
                                control={form.control}
                                name="qualificationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qualification</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a qualification" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {qualifications.map((qual) => (
                                                    <SelectItem key={qual.id} value={qual.id}>
                                                        {qual.abbreviation} — {qual.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedType === "HasMedal" && (
                            <FormField
                                control={form.control}
                                name="requiredMedalId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Required medal</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a medal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {allMedals.map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedType === "ZeusCount" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="zeusRole"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ?? "Either"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {zeusRoles.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
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
                                    name="eventType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Operation type</FormLabel>
                                            <Select
                                                onValueChange={(val) =>
                                                    field.onChange(val === "any" ? null : val)
                                                }
                                                value={field.value ?? "any"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="any">
                                                        Any operation type
                                                    </SelectItem>
                                                    {criteriaEventTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {NEEDS_THRESHOLD[selectedType] && (
                            <FormField
                                control={form.control}
                                name="threshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Threshold</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={isPending}>
                                {isPending ? "Adding..." : "Add rule"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}