"use server";

import { db } from "@/db";
import {
    campaigns,
    NewCampaign,
    events,
    operations,
    trainingEvents,
    troopers,
} from "@/db/schema";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function getCampaigns() {
    try {
        const campaignsList = await db.query.campaigns.findMany({
            orderBy: [desc(campaigns.createdAt)],
        });
        return campaignsList;
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
    }
}

export async function getCampaignById(id: string) {
    try {
        const campaign = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, id),
            with: {
                events: {
                    orderBy: [asc(events.eventDate)],
                    with: {
                        operation: true,
                        trainingEvent: true,
                    },
                },
            },
        });
        return campaign;
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return null;
    }
}

export async function createCampaign(campaign: NewCampaign) {
    try {
        const result = await db.insert(campaigns).values(campaign).returning();
        revalidateTag("campaigns");
        return { success: true, id: result[0].id };
    } catch (error) {
        console.error("Error creating campaign:", error);
        return { error: "Failed to create campaign" };
    }
}

export async function updateCampaign(campaign: NewCampaign) {
    try {
        if (!campaign.id) {
            throw new Error("Campaign ID is required");
        }

        const { id, ...updateData } = campaign;

        await db.update(campaigns).set(updateData).where(eq(campaigns.id, id));

        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error updating campaign:", error);
        return { error: "Failed to update campaign" };
    }
}

export async function deleteCampaign(id: string) {
    try {
        await db.delete(campaigns).where(eq(campaigns.id, id));
        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return { error: "Failed to delete campaign" };
    }
}
