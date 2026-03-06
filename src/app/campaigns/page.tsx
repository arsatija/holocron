"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin } from "lucide-react";
import { format, isPast } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { Campaign } from "@/db/schema";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";

function getCampaignStatus(campaign: Campaign): {
    label: string;
    variant: "default" | "secondary" | "destructive";
} {
    if (campaign.endDate && isPast(parseLocalDate(campaign.endDate))) {
        return { label: "Concluded", variant: "secondary" };
    }
    if (campaign.isActive) {
        return { label: "Active", variant: "default" };
    }
    return { label: "Inactive", variant: "secondary" };
}

export default function CampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch("/api/v1/campaigns");
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Campaigns
                    </h1>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                                <div className="h-3 bg-muted rounded w-2/3"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Campaigns
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Tactical operations across all theatres
                    </p>
                </div>
                <ProtectedComponent
                    allowedPermissions={[
                        RankLevel.Command,
                        RankLevel.Company,
                        "sgd:2ic",
                        "sgd-lore:2ic",
                        "admin:2ic",
                    ]}
                >
                    <Button onClick={() => router.push("/campaigns/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </ProtectedComponent>
            </div>

            {campaigns.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No campaigns yet
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first campaign to start organizing
                            operations and tracking progress.
                        </p>
                        <ProtectedComponent
                            allowedPermissions={[
                                "Admin",
                                RankLevel.Command,
                                RankLevel.Company,
                            ]}
                        >
                            <Button onClick={() => router.push("/campaigns/new")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Campaign
                            </Button>
                        </ProtectedComponent>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => {
                        const status = getCampaignStatus(campaign);
                        return (
                            <Card
                                key={campaign.id}
                                className="cursor-pointer hover:shadow-lg hover:border-accent9th/30 transition-all duration-200 group"
                                onClick={() =>
                                    router.push(`/campaigns/${campaign.id}`)
                                }
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg group-hover:text-accent9th transition-colors truncate">
                                                {campaign.name}
                                            </CardTitle>
                                            <CardDescription>
                                                Started{" "}
                                                {format(
                                                    parseLocalDate(
                                                        campaign.startDate
                                                    ),
                                                    "MMM dd, yyyy"
                                                )}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={status.variant}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {campaign.description ||
                                            "No description provided"}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {campaign.endDate
                                                    ? `${format(
                                                          parseLocalDate(
                                                              campaign.startDate
                                                          ),
                                                          "MMM dd"
                                                      )} – ${format(
                                                          parseLocalDate(
                                                              campaign.endDate
                                                          ),
                                                          "MMM dd, yyyy"
                                                      )}`
                                                    : "Ongoing"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
