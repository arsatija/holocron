"use server";

import { db } from "@/db";
import {
    campaigns,
    NewCampaign,
    campaignEvents,
    NewCampaignEvent,
    campaignEventAttendances,
    NewCampaignEventAttendance,
    troopers,
} from "@/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
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
                    orderBy: [asc(campaignEvents.eventDate)],
                    with: {
                        attendances: {
                            with: {
                                trooper: true,
                            },
                        },
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
        
        await db
            .update(campaigns)
            .set(updateData)
            .where(eq(campaigns.id, id));

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

export async function getCampaignEvents(campaignId: string) {
    try {
        const events = await db.query.campaignEvents.findMany({
            where: eq(campaignEvents.campaignId, campaignId),
            orderBy: [asc(campaignEvents.eventDate)],
            with: {
                attendances: {
                    with: {
                        trooper: true,
                    },
                },
            },
        });
        return events;
    } catch (error) {
        console.error("Error fetching campaign events:", error);
        return [];
    }
}

export async function getCampaignEventById(eventId: string) {
    try {
        const event = await db.query.campaignEvents.findFirst({
            where: eq(campaignEvents.id, eventId),
            with: {
                attendances: {
                    with: {
                        trooper: true,
                    },
                },
            },
        });
        return event;
    } catch (error) {
        console.error("Error fetching campaign event:", error);
        return null;
    }
}

export interface NewCampaignEventWithTroopers extends NewCampaignEvent {
    trooperIds: string[];
}

export async function createCampaignEvent(event: NewCampaignEventWithTroopers) {
    try {
        const result = await db.transaction(async (tx) => {
            const eventInfo = {
                campaignId: event.campaignId,
                name: event.name,
                description: event.description,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                eventType: event.eventType,
                zeusId: event.zeusId,
                coZeusIds: event.coZeusIds,
                eventNotes: event.eventNotes,
            };

            const newEvent = await tx
                .insert(campaignEvents)
                .values(eventInfo)
                .returning();

            if (newEvent.length === 0) {
                throw new Error("Failed to create campaign event");
            }

            // Add troopers to the event
            if (event.trooperIds.length > 0) {
                await tx.insert(campaignEventAttendances).values(
                    event.trooperIds.map((trooperId) => ({
                        campaignEventId: newEvent[0].id,
                        trooperId: trooperId,
                    }))
                );
            }

            return newEvent[0].id;
        });

        revalidateTag("campaigns");
        return { success: true, id: result };
    } catch (error) {
        console.error("Error creating campaign event:", error);
        return { error: "Failed to create campaign event" };
    }
}

export async function updateCampaignEvent(event: NewCampaignEventWithTroopers) {
    try {
        if (!event.id || event.id === '') {
            throw new Error("Event ID is required");
        }

        const result = await db.transaction(async (tx) => {
            // Update the event
            const updateData: any = {
                name: event.name,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                eventType: event.eventType,
            };
            
            // Only update these fields if they are provided (not null/undefined)
            // Convert empty strings to null for UUID fields
            if (event.description !== undefined) updateData.description = event.description;
            
            // Handle zeusId - convert empty string to null for UUID fields
            if (event.zeusId !== undefined) {
                updateData.zeusId = event.zeusId === '' ? null : event.zeusId;
            }
            
            if (event.coZeusIds !== undefined) updateData.coZeusIds = event.coZeusIds;
            if (event.eventNotes !== undefined) updateData.eventNotes = event.eventNotes;
            
            await tx
                .update(campaignEvents)
                .set(updateData)
                .where(eq(campaignEvents.id, event.id!));

            // Update attendances
            const currentAttendances = await tx.query.campaignEventAttendances
                .findMany({
                    where: eq(
                        campaignEventAttendances.campaignEventId,
                        event.id!
                    ),
                    columns: {
                        trooperId: true,
                    },
                })
                .then((attendances) =>
                    attendances.map((attendance) => attendance.trooperId)
                );

            const addedTroopers = event.trooperIds.filter(
                (id) => !currentAttendances.includes(id)
            );
            const removedTroopers = currentAttendances.filter(
                (id) => !event.trooperIds.includes(id)
            );

            // Add new attendances
            if (addedTroopers.length > 0) {
                await tx.insert(campaignEventAttendances).values(
                    addedTroopers.map((trooperId) => ({
                        campaignEventId: event.id!,
                        trooperId: trooperId,
                    }))
                );
            }

            // Remove old attendances
            if (removedTroopers.length > 0) {
                await tx
                    .delete(campaignEventAttendances)
                    .where(
                        and(
                            eq(
                                campaignEventAttendances.campaignEventId,
                                event.id!
                            ),
                            inArray(
                                campaignEventAttendances.trooperId,
                                removedTroopers
                            )
                        )
                    );
            }
        });

        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error updating campaign event:", error);
        return { error: "Failed to update campaign event" };
    }
}

export async function deleteCampaignEvent(id: string) {
    try {
        await db.delete(campaignEvents).where(eq(campaignEvents.id, id));
        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign event:", error);
        return { error: "Failed to delete campaign event" };
    }
}
