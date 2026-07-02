"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medalFormSchema, MedalFormValues } from "../_lib/schema";
import { createMedalAction, updateMedalAction } from "../_lib/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useTransition } from "react";

const MEDAL_IMAGES = [
    "1_Yr.png",
    "2_Yr.png",
    "3_Yr.png",
    "4_Yr.png",
    "5_Yr.png",
    "6_Yr.png",
    "7_Yr.png",
    "8_Yr.png",
    "9_Yr.png",
    "10_Yr.png",
    "Cinder_Plt_Medal.png",
    "Command_Honours_Medal.png",
    "Distinguished_Battlefield_Veteran_Medal.png",
    "Expert_Trainer_Medal.png",
    "Perservernace_Medal.png",
];

function fileNameToLabel(filename: string) {
    return filename.replace(".png", "").replace(/_/g, " ");
}

interface MedalFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: MedalFormValues & { id?: string };
    onSuccess: () => void;
}

export function MedalForm({ open, onOpenChange, defaultValues, onSuccess }: MedalFormProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!defaultValues?.id;

    const form = useForm<MedalFormValues>({
        resolver: zodResolver(medalFormSchema),
        defaultValues: defaultValues ?? {
            name: "",
            description: "",
            imageUrl: "",
        },
    });

    const selectedImage = form.watch("imageUrl");

    function onSubmit(values: MedalFormValues) {
        startTransition(async () => {
            const result = isEdit
                ? await updateMedalAction(defaultValues!.id!, values)
                : await createMedalAction(values);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Medal updated" : "Medal created");
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
                    <DialogTitle>{isEdit ? "Edit Medal" : "Create Medal"}</DialogTitle>
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
                                        <Input placeholder="Perseverance Medal" {...field} />
                                    </FormControl>
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
                                        <Textarea
                                            placeholder="Awarded for..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image</FormLabel>
                                    <div className="flex gap-3 items-center">
                                        {selectedImage && (
                                            <div className="relative h-12 w-12 shrink-0">
                                                <Image
                                                    src={selectedImage}
                                                    alt="Preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                        <Select
                                            onValueChange={(val) => field.onChange(`/images/medals/${val}`)}
                                            value={field.value ? field.value.replace("/images/medals/", "") : ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an image" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MEDAL_IMAGES.map((img) => (
                                                    <SelectItem key={img} value={img}>
                                                        {fileNameToLabel(img)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
