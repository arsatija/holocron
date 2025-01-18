"use client";

import { Rank, Status, Trooper } from "@/db/schema";
import Image from "next/image";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import AttendanceHeatmap from "./_components/Heatmap";
import Qualifications from "./_components/qualifications";
import { Badge } from "@/components/ui/badge";

import { useEffect, useState, useTransition } from "react";
import { TrooperProfileBilletResponse } from "@/lib/types";
import ProfileSkeleton from "./_components/ProfileSkeleton";
import { notFound, useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Link, EllipsisIcon, Loader, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogDescription,
    DialogTitle,
    DialogContent,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog";
import DepartmentInformation from "./_components/Departments";

export default function Profile() {
    const { id }: { id: string } = useParams();
    const [rank, setRank] = useState<Rank>();
    const [billetInformation, setBilletInformation] =
        useState<TrooperProfileBilletResponse>();
    const [trooper, setTrooper] = useState<Trooper>();

    const [rankLoading, setRankLoading] = useState(true);
    const [billetLoading, setBilletLoading] = useState(true);
    const [trooperLoading, setTrooperLoading] = useState(true);

    const [isAccountLinked, setIsAccountLinked] = useState(true);

    useEffect(() => {
        fetch("/api/v1/trooper?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                console.log("trooper", data);
                setTrooper(data);
                setTrooperLoading(false);
            });
        fetch("/api/v1/rank?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setRank(data);
                setRankLoading(false);
            });
        fetch("/api/v1/billetInformation?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setBilletInformation(data.billet);
                setBilletLoading(false);
            });
        fetch("/api/v1/user?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                console.log("user: ", data);
                if (data == null) {
                    setIsAccountLinked(false);
                } else {
                    setIsAccountLinked(true);
                }
            });
    }, [id]);

    const statusColor = (status: Status) => {
        if (status == "Active") return "bg-green-400";
        else if (status == "Inactive") return "bg-orange-400";
        else if (status == "Discharged") return "bg-red-400";
        else return "bg-muted";
    };

    if (!trooper && !trooperLoading) {
        notFound();
    }

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState<string>("");
    const [isInviteGenerating, setIsInviteGenerating] = useTransition();

    function handleInviteClick() {
        setIsDialogOpen(true); // Open dialog

        setIsInviteGenerating(async () => {
            // Generate invite link for the created trooper
            const response = await fetch("/api/v1/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trooperId: id }), // Send trooperId
            });

            if (!response.ok) {
                toast.error("Failed to generate invite link.");
                return;
            }

            const { inviteLink } = await response.json();

            // Show success and open dialog with invite link
            setInviteLink(inviteLink); // Set invite link for the dialog
        });
    }

    function InviteDialog() {
        const handleCopyToClipboard = () => {
            navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied to clipboard!");
        };

        return (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogTitle>Trooper Invite Link</DialogTitle>
                    {isInviteGenerating ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="size-4 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <DialogDescription>
                                Copy the link below and send it to the recruit:
                            </DialogDescription>
                            <ScrollArea className="mt-2 mb-4 p-2 border rounded">
                                <code className="">{inviteLink}</code>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <DialogFooter>
                                <Button
                                    onClick={handleCopyToClipboard}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Copy to Clipboard
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div className="px-8">
            {rankLoading || billetLoading || trooperLoading ? (
                <div className="flex justify-center items-center h-full">
                    <ProfileSkeleton />
                </div>
            ) : (
                <div className="flex flex-col h-screen gap-4">
                    {!isAccountLinked && (
                        <Alert variant="default">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Heads up!</AlertTitle>
                            <AlertDescription className="flex justify-between">
                                <p>This trooper is not linked to an account!</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="absolute top-4 right-4 z-20"
                                        >
                                            <EllipsisIcon />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onSelect={handleInviteClick}
                                        >
                                            Generate Invite Link
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="w-full grid lg:grid-cols-3 gap-4 align-top">
                        {/* Left column */}
                        <div className="w-auto lg:col-span-1 space-y-4">
                            <Card className="rounded-xl shadow-md">
                                <div className="space-y-12">
                                    <div className="p-6 relative">
                                        <div className="flex flex-col items-center">
                                            <Image
                                                alt="Billet Logo"
                                                src={
                                                    billetInformation?.unitElement
                                                        ? billetInformation
                                                              .unitElement.icon
                                                        : "/images/9_logo.png"
                                                }
                                                height={225}
                                                width={225}
                                                className="aspect-square w-36 object-contain h-auto"
                                            />
                                            <h4 className="text-3xl lg:text-4xl font-bold text-center pt-6">
                                                {getFullTrooperName(trooper!)}
                                            </h4>
                                            <div className="text-lg text-muted-foreground py-2">
                                                {billetInformation?.unitElement
                                                    .name
                                                    ? billetInformation
                                                          .unitElement.name
                                                    : "Unbilleted"}{" "}
                                                <Badge variant={"secondary"}>
                                                    {rank?.rankLevel}
                                                </Badge>
                                            </div>
                                            <div
                                                className={`rounded-xl w-1/4 h-8 flex mt-6 items-center justify-center ${statusColor(
                                                    trooper!.status
                                                )}`}
                                            >
                                                {trooper!.status}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x text-center mt-10">
                                            <div>
                                                <h5 className="text-lg font-semibold">
                                                    {formatDate(
                                                        new Date(
                                                            trooper!
                                                                .recruitmentDate ??
                                                                Date.now()
                                                        )
                                                    )}
                                                </h5>
                                                <div className="text-sm text-muted-foreground">
                                                    Recruitment Date
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-semibold">
                                                    {billetInformation?.superiorTrooper
                                                        ? getFullTrooperName(
                                                              billetInformation.superiorTrooper
                                                          )
                                                        : "N/A"}
                                                </h5>
                                                <div className="text-sm text-muted-foreground">
                                                    Direct Superior
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-semibold">
                                                    {trooper!.attendances}
                                                </h5>
                                                <div className="text-sm text-muted-foreground">
                                                    Attendances
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <DepartmentInformation trooperId={id} />
                        </div>

                        {/* Right column */}
                        <div className="lg:col-span-2 w-auto space-y-4">
                            <AttendanceHeatmap trooperId={id} />
                            <Qualifications trooperId={id} />
                        </div>
                    </div>
                </div>
            )}
            <InviteDialog />
        </div>
    );
}
