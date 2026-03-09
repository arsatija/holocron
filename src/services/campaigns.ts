"use server";

import { db } from "@/db";
import {
    campaigns,
    campaignPhases,
    NewCampaign,
    NewCampaignPhase,
    events,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";

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

export async function getCampaignDetail(id: string) {
    try {
        const campaign = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, id),
            with: {
                phases: {
                    orderBy: [asc(campaignPhases.order)],
                },
                events: {
                    orderBy: [asc(events.eventDate)],
                    with: {
                        operation: true,
                    },
                },
            },
        });
        return campaign;
    } catch (error) {
        console.error("Error fetching campaign detail:", error);
        return null;
    }
}

export async function createCampaign(campaign: NewCampaign, actorId?: string) {
    try {
        const result = await db.insert(campaigns).values(campaign).returning();
        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "campaign",
            entityId: result[0].id,
            entityLabel: result[0].name,
            newData: result[0] as unknown as Record<string, unknown>,
        });
        return { success: true, id: result[0].id };
    } catch (error) {
        console.error("Error creating campaign:", error);
        return { error: "Failed to create campaign" };
    }
}

export async function updateCampaign(campaign: NewCampaign, actorId?: string) {
    try {
        if (!campaign.id) {
            throw new Error("Campaign ID is required");
        }

        const { id, ...updateData } = campaign;

        const previous = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
        await db.update(campaigns).set(updateData).where(eq(campaigns.id, id));

        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "campaign",
            entityId: id,
            entityLabel: campaign.name ?? previous?.name,
            previousData: previous as unknown as Record<string, unknown>,
            newData: campaign as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating campaign:", error);
        return { error: "Failed to update campaign" };
    }
}

export async function deleteCampaign(id: string, actorId?: string) {
    try {
        const previous = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
        await db.delete(campaigns).where(eq(campaigns.id, id));
        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "campaign",
            entityId: id,
            entityLabel: previous?.name,
            previousData: previous as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return { error: "Failed to delete campaign" };
    }
}

export async function getCampaignPhases(campaignId: string) {
    try {
        return await db.query.campaignPhases.findMany({
            where: eq(campaignPhases.campaignId, campaignId),
            orderBy: [asc(campaignPhases.order)],
        });
    } catch (error) {
        console.error("Error fetching campaign phases:", error);
        return [];
    }
}

export async function createCampaignPhase(phase: NewCampaignPhase, actorId?: string) {
    try {
        const result = await db
            .insert(campaignPhases)
            .values(phase)
            .returning();
        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "campaign",
            entityId: result[0].id,
            entityLabel: `Phase: ${result[0].title}`,
            newData: result[0] as unknown as Record<string, unknown>,
        });
        return { success: true, id: result[0].id };
    } catch (error) {
        console.error("Error creating campaign phase:", error);
        return { error: "Failed to create campaign phase" };
    }
}

export async function updateCampaignPhase(
    id: string,
    data: Partial<NewCampaignPhase>,
    actorId?: string,
) {
    try {
        const previous = await db.query.campaignPhases.findFirst({ where: eq(campaignPhases.id, id) });
        await db
            .update(campaignPhases)
            .set(data)
            .where(eq(campaignPhases.id, id));
        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "campaign",
            entityId: id,
            entityLabel: `Phase: ${data.title ?? previous?.title}`,
            previousData: previous as unknown as Record<string, unknown>,
            newData: data as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating campaign phase:", error);
        return { error: "Failed to update campaign phase" };
    }
}

export async function deleteCampaignPhase(id: string, actorId?: string) {
    try {
        const previous = await db.query.campaignPhases.findFirst({ where: eq(campaignPhases.id, id) });
        await db.delete(campaignPhases).where(eq(campaignPhases.id, id));
        revalidateTag("campaigns");
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "campaign",
            entityId: id,
            entityLabel: `Phase: ${previous?.title}`,
            previousData: previous as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign phase:", error);
        return { error: "Failed to delete campaign phase" };
    }
}
