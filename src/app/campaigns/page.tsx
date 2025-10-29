"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, MapPin } from "lucide-react";
import { format } from "date-fns";
import CreateCampaignDialog from "./_components/create-campaign-dialog";
import CampaignDetailsDialog from "./_components/campaign-details-dialog";
import { Campaign } from "@/db/schema";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
        null
    );

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

    const handleCampaignCreated = () => {
        fetchCampaigns();
        setCreateDialogOpen(false);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Campaigns</h1>
                <ProtectedComponent
                    allowedPermissions={[
                        "Admin",
                        RankLevel.Command,
                        RankLevel.Company,
                    ]}
                >
                    <Button onClick={() => setCreateDialogOpen(true)}>
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
                            events and tracking attendance.
                        </p>
                        <ProtectedComponent
                            allowedPermissions={[
                                "Admin",
                                RankLevel.Command,
                                RankLevel.Company,
                            ]}
                        >
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Campaign
                            </Button>
                        </ProtectedComponent>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <Card
                            key={campaign.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedCampaign(campaign)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {campaign.name}
                                        </CardTitle>
                                        <CardDescription>
                                            Started{" "}
                                            {format(
                                                new Date(campaign.startDate),
                                                "MMM dd, yyyy"
                                            )}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            campaign.isActive
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {campaign.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                    {campaign.description ||
                                        "No description provided"}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {campaign.endDate
                                                ? `${format(
                                                      new Date(
                                                          campaign.startDate
                                                      ),
                                                      "MMM dd"
                                                  )} - ${format(
                                                      new Date(
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
                    ))}
                </div>
            )}

            <Separator className="my-6" />

            <h1 className="text-3xl font-bold">Standalone Events</h1>

            <CreateCampaignDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCampaignCreated={handleCampaignCreated}
            />

            <CampaignDetailsDialog
                campaign={selectedCampaign}
                open={!!selectedCampaign}
                onOpenChange={(open) => !open && setSelectedCampaign(null)}
                onCampaignUpdated={fetchCampaigns}
            />
        </div>
    );
}
