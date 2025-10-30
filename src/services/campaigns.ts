"use server";

import { db } from "@/db";
import {
    campaigns,
    NewCampaign,
    campaignEvents,
    NewCampaignEvent,
    troopers,
    attendances,
    trooperAttendances,
    NewAttendance,
    NewTrooperAttendance,
} from "@/db/schema";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { TrooperBasicInfo, EventEntry } from "@/lib/types";

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

export async function getCampaignEvents(campaignId: string) {
    try {
        const events = await db.query.campaignEvents.findMany({
            where: eq(campaignEvents.campaignId, campaignId),
            orderBy: [asc(campaignEvents.eventDate)],
        });
        return events;
    } catch (error) {
        console.error("Error fetching campaign events:", error);
        return [];
    }
}

export async function getCampaignEventById(
    eventId: string
): Promise<EventEntry | null> {
    try {
        const event = await db.query.campaignEvents.findFirst({
            where: eq(campaignEvents.id, eventId),
        });

        if (!event) {
            return null;
        }

        // Get Zeus and Co-Zeus trooper data if they exist
        let zeusTrooper: TrooperBasicInfo | null = null;
        let coZeusTroopers: TrooperBasicInfo[] = [] as TrooperBasicInfo[];

        if (event.zeusId) {
            const zeus = await db.query.troopers.findFirst({
                where: eq(troopers.id, event.zeusId),
            });
            if (zeus) {
                zeusTrooper = {
                    id: zeus.id,
                    name: zeus.name,
                    numbers: zeus.numbers,
                    rank: zeus.rank,
                };
            }
        }

        if (event.coZeusIds && event.coZeusIds.length > 0) {
            const coZeuses = await db.query.troopers.findMany({
                where: inArray(troopers.id, event.coZeusIds),
            });
            coZeusTroopers = coZeuses.map(
                (cozeus): TrooperBasicInfo => ({
                    id: cozeus.id,
                    name: cozeus.name,
                    numbers: cozeus.numbers,
                    rank: cozeus.rank,
                })
            );
        }

        return {
            id: event.id,
            name: event.name,
            description: event.description || "",
            bannerImage: event.bannerImage,
            eventDate: event.eventDate,
            eventTime: event.eventTime || "",
            eventType: event.eventType,
            zeus: zeusTrooper,
            coZeus: coZeusTroopers,
            attendanceId: event.attendanceId || "",
            eventNotes: event.eventNotes || "",
        };
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
            // Create attendance record first
            const attendanceData = {
                zeusId: event.zeusId,
                coZeusIds: event.coZeusIds,
                eventDate: event.eventDate,
                eventType: event.eventType,
                eventNotes: `Attendance created for '${event.name}'`,
            };

            const newAttendance = await tx
                .insert(attendances)
                .values(attendanceData)
                .returning();

            if (newAttendance.length === 0) {
                throw new Error("Failed to create attendance");
            }

            // Create the event with reference to the attendance
            const eventInfo = {
                campaignId: event.campaignId,
                attendanceId: newAttendance[0].id,
                name: event.name,
                description: event.description,
                bannerImage: event.bannerImage || null,
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

            // Link troopers to the attendance via trooperAttendances
            if (event.trooperIds.length > 0) {
                await tx.insert(trooperAttendances).values(
                    event.trooperIds.map((trooperId) => ({
                        attendanceId: newAttendance[0].id,
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
        if (!event.id || event.id === "") {
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
            if (event.description !== undefined)
                updateData.description = event.description;
            if (event.bannerImage !== undefined)
                updateData.bannerImage = event.bannerImage || null;

            // Handle zeusId - convert empty string to null for UUID fields
            if (event.zeusId !== undefined) {
                updateData.zeusId = event.zeusId === "" ? null : event.zeusId;
            }

            if (event.coZeusIds !== undefined)
                updateData.coZeusIds = event.coZeusIds;
            if (event.eventNotes !== undefined)
                updateData.eventNotes = event.eventNotes;

            await tx
                .update(campaignEvents)
                .set(updateData)
                .where(eq(campaignEvents.id, event.id!));

            // Get existing event to find its attendanceId
            const existingEvent = await tx.query.campaignEvents.findFirst({
                where: eq(campaignEvents.id, event.id!),
            });

            if (!existingEvent) {
                throw new Error("Event not found");
            }

            let attendanceId = existingEvent.attendanceId;

            // If event doesn't have an attendance, create one
            if (!attendanceId) {
                const attendanceData = {
                    zeusId: event.zeusId === "" ? null : event.zeusId,
                    coZeusIds: event.coZeusIds,
                    eventDate: event.eventDate,
                    eventType: event.eventType,
                    eventNotes: `Attendance created for '${event.name}'`,
                };

                const newAttendance = await tx
                    .insert(attendances)
                    .values(attendanceData)
                    .returning();

                if (newAttendance.length === 0) {
                    throw new Error("Failed to create attendance");
                }

                attendanceId = newAttendance[0].id;

                // Update the event to reference the new attendance
                await tx
                    .update(campaignEvents)
                    .set({ attendanceId })
                    .where(eq(campaignEvents.id, event.id!));
            } else {
                // Update existing attendance record
                const attendanceData = {
                    zeusId: event.zeusId === "" ? null : event.zeusId,
                    coZeusIds: event.coZeusIds,
                    eventDate: event.eventDate,
                    eventType: event.eventType,
                };

                await tx
                    .update(attendances)
                    .set(attendanceData)
                    .where(eq(attendances.id, attendanceId));
            }

            // Get current trooper attendances for this attendanceId
            const currentAttendances = await tx.query.trooperAttendances
                .findMany({
                    where: eq(trooperAttendances.attendanceId, attendanceId),
                    columns: {
                        trooperId: true,
                    },
                })
                .then((attendances) =>
                    attendances.map((attendance) => attendance.trooperId)
                );

            const trooperIds = event.trooperIds || [];

            const addedTroopers = trooperIds.filter(
                (id) => !currentAttendances.includes(id)
            );
            const removedTroopers = currentAttendances.filter(
                (id) => !trooperIds.includes(id)
            );

            // Add new trooper attendances
            if (addedTroopers.length > 0) {
                await tx.insert(trooperAttendances).values(
                    addedTroopers.map((trooperId) => ({
                        attendanceId: attendanceId,
                        trooperId: trooperId,
                    }))
                );
            }

            // Remove old trooper attendances
            if (removedTroopers.length > 0) {
                await tx
                    .delete(trooperAttendances)
                    .where(
                        and(
                            eq(trooperAttendances.attendanceId, attendanceId),
                            inArray(
                                trooperAttendances.trooperId,
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
        await db.transaction(async (tx) => {
            // Get the event to find its attendanceId
            const event = await tx.query.campaignEvents.findFirst({
                where: eq(campaignEvents.id, id),
            });

            // Delete the event
            await tx.delete(campaignEvents).where(eq(campaignEvents.id, id));

            // Delete associated attendance and its trooperAttendances
            // We do this after deleting the event since the foreign key has onDelete: "set null"
            if (event?.attendanceId) {
                // Delete trooperAttendances first (they reference attendance)
                await tx
                    .delete(trooperAttendances)
                    .where(
                        eq(trooperAttendances.attendanceId, event.attendanceId)
                    );

                // Then delete the attendance record itself
                await tx
                    .delete(attendances)
                    .where(eq(attendances.id, event.attendanceId));
            }
        });

        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign event:", error);
        return { error: "Failed to delete campaign event" };
    }
}
