"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock, ArrowLeft } from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTroopersAsOptions } from "@/services/troopers";
import TiptapEditor from "@/components/tiptap/editor";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image as ImageIcon, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const createEventSchema = z.object({
    name: z.string().min(1, "Event name is required").max(255, "Name too long"),
    description: z.string().optional(),
    eventDate: z.date({
        required_error: "Event date is required",
    }),
    eventTime: z.string().optional(),
    eventType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]),
    zeusId: z.string().uuid().optional(),
    coZeusIds: z.array(z.string().uuid()).optional(),
    eventNotes: z.string().optional(),
    trooperIds: z.array(z.string().uuid()).default([]),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;

    const [isPending, startTransition] = useTransition();
    const [trooperOptions, setTrooperOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [bannerImage, setBannerImage] = useState("");
    const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
    const [tempBannerUrl, setTempBannerUrl] = useState("");
    const [description, setDescription] = useState("");

    const form = useForm<CreateEventFormData>({
        resolver: zodResolver(createEventSchema),
        defaultValues: {
            name: "",
            description: "",
            eventDate: new Date(),
            eventTime: "",
            eventType: "Main",
            eventNotes: "",
            trooperIds: [],
        },
    });

    useEffect(() => {
        const fetchTroopers = async () => {
            try {
                const options = await getTroopersAsOptions();
                setTrooperOptions(options);
            } catch (error) {
                console.error("Error fetching troopers:", error);
            }
        };
        fetchTroopers();
    }, []);

    const onSubmit = (data: CreateEventFormData) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/v1/campaign-events", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...data,
                        campaignId,
                        description: description,
                        bannerImage: bannerImage || null,
                        eventDate: data.eventDate.toISOString().split("T")[0],
                    }),
                });

                if (response.ok) {
                    toast.success("Event created successfully");
                    router.push(
                        `/campaigns/${campaignId}/events/${
                            (await response.json()).id
                        }`
                    );
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to create event");
                }
            } catch (error) {
                console.error("Error creating event:", error);
                toast.error("Failed to create event");
            }
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Button
                variant="ghost"
                className="mb-6"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaign
            </Button>

            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
                <p className="text-muted-foreground">
                    Add a new event to this campaign
                </p>
            </div>

            {/* Banner Image Upload */}
            <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                    Banner Image
                </label>
                <AspectRatio ratio={4 / 1}>
                    {bannerImage ? (
                        <div className="relative w-full h-full">
                            <img
                                src={bannerImage}
                                alt="Banner preview"
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                    setBannerImage("");
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            className="w-full h-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                            onClick={() => {
                                setTempBannerUrl("");
                                setBannerDialogOpen(true);
                            }}
                        >
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Click to add banner image URL
                            </p>
                        </div>
                    )}
                </AspectRatio>
            </div>

            {/* Banner URL Dialog */}
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Banner Image</DialogTitle>
                        <DialogDescription>
                            Enter the URL of the image you want to use as the
                            event banner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="https://example.com/image.jpg"
                            value={tempBannerUrl}
                            onChange={(e) => setTempBannerUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    setBannerImage(tempBannerUrl);
                                    setBannerDialogOpen(false);
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBannerDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setBannerImage(tempBannerUrl);
                                setBannerDialogOpen(false);
                            }}
                        >
                            Add Banner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProtectedComponent
                allowedPermissions={[
                    "sgd:2ic",
                    "sgd-lore:2ic",
                    "Admin",
                    RankLevel.Command,
                    RankLevel.Company,
                ]}
                fallback={
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Unauthorized
                            </CardTitle>
                            <CardDescription>
                                You don't have permission to create events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Go Back
                            </Button>
                        </CardContent>
                    </Card>
                }
            >
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
                                    <FormLabel>Event Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter event name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Brief</label>
                            <TiptapEditor
                                value={description}
                                onChange={(value) => setDescription(value)}
                                editable={true}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="eventDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Event Date</FormLabel>
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
                                                            <span>
                                                                Pick a date
                                                            </span>
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
                                                    disabled={(date) =>
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
                                name="eventTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Time</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="HH:MM"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Format: HH:MM (24-hour) EST
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="eventType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Main">
                                                Main
                                            </SelectItem>
                                            <SelectItem value="Skirmish">
                                                Skirmish
                                            </SelectItem>
                                            <SelectItem value="Fun">
                                                Fun
                                            </SelectItem>
                                            <SelectItem value="Raid">
                                                Raid
                                            </SelectItem>
                                            <SelectItem value="Joint">
                                                Joint
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eventNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter event notes"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                Create Event
                            </Button>
                        </div>
                    </form>
                </Form>
            </ProtectedComponent>
        </div>
    );
}
