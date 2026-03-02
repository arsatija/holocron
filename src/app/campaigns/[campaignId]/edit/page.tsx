"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Campaign } from "@/db/schema";

const editCampaignSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(1, "Campaign name is required")
        .max(255, "Name too long"),
    description: z.string().optional(),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date().optional().nullable(),
    isActive: z.boolean().default(true),
});

type EditCampaignFormData = z.infer<typeof editCampaignSchema>;

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;

    const [isPending, startTransition] = useTransition();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    const form = useForm<EditCampaignFormData>({
        resolver: zodResolver(editCampaignSchema),
        defaultValues: {
            id: "",
            name: "",
            description: "",
            startDate: new Date(),
            endDate: null,
            isActive: true,
        },
    });

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const response = await fetch(`/api/v1/campaigns`);
                if (response.ok) {
                    const campaigns = await response.json();
                    const foundCampaign = campaigns.find(
                        (c: Campaign) => c.id === campaignId
                    );
                    if (foundCampaign) {
                        setCampaign(foundCampaign);
                        form.reset({
                            id: foundCampaign.id,
                            name: foundCampaign.name,
                            description: foundCampaign.description || "",
                            startDate: new Date(foundCampaign.startDate),
                            endDate: foundCampaign.endDate
                                ? new Date(foundCampaign.endDate)
                                : null,
                            isActive: foundCampaign.isActive,
                        });
                    } else {
                        toast.error("Campaign not found");
                    }
                } else {
                    toast.error("Failed to load campaign");
                }
            } catch (error) {
                console.error("Error fetching campaign:", error);
                toast.error("Failed to load campaign");
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const onSubmit = (data: EditCampaignFormData) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/v1/campaigns", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...data,
                        startDate: data.startDate.toISOString().split("T")[0],
                        endDate: data.endDate
                            ? data.endDate.toISOString().split("T")[0]
                            : null,
                    }),
                });

                if (response.ok) {
                    toast.success("Campaign updated successfully");
                    router.back();
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to update campaign");
                }
            } catch (error) {
                console.error("Error updating campaign:", error);
                toast.error("Failed to update campaign");
            }
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-accent9th" />
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <p>Campaign not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-2xl">
            <Button
                variant="ghost"
                className="mb-6"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
            </Button>

            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Edit Campaign</h1>
                <p className="text-muted-foreground">Update campaign details</p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter campaign name"
                                        {...field}
                                    />
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
                                        placeholder="Enter campaign description"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP"
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    date <
                                                    new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Date (Optional)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP"
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    field.value || undefined
                                                }
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    date <
                                                    new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex gap-4 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update Campaign
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
