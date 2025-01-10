"use client";

import {
    Calculator,
    Calendar,
    Check,
    ChevronsUpDown,
    CreditCard,
    Settings,
    Smile,
    User,
} from "lucide-react";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import { FormControl } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Builder() {
    const [troopers, setTroopers] = useState<
        { label: string; value: string }[]
    >([]);
    const [isLoading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));
    }, []);
    // const troopers = [
    //     {
    //         label: 'CC-6666 "Rav"',
    //         value: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
    //     },
    //     {
    //         label: 'CC-8961 "Retry"',
    //         value: "fb4dacf0-1177-4163-b506-023439ea3e39",
    //     },
    // ] as const;

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                    >
                        {value
                            ? troopers.find(
                                  (trooper) => trooper.value === value
                              )?.label
                            : "Select framework..."}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search framework..."
                            className="h-9"
                        />
                        <ScrollArea>
                            <CommandList>
                                <CommandEmpty>No framework found.</CommandEmpty>
                                <CommandGroup>
                                    {troopers.map((trooper) => (
                                        <CommandItem
                                            key={trooper.value}
                                            value={trooper.value}
                                            onSelect={(currentValue) => {
                                                setValue(
                                                    currentValue === value
                                                        ? ""
                                                        : currentValue
                                                );
                                                setOpen(false);
                                            }}
                                        >
                                            {trooper.label}
                                            <Check
                                                className={cn(
                                                    "ml-auto",
                                                    value === trooper.value
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
