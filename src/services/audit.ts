"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { eq, desc, and, SQL } from "drizzle-orm";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
    | "trooper"
    | "trooper_rank"
    | "trooper_qualification"
    | "trooper_bio"
    | "attendance"
    | "trooper_attendance"
    | "training_completion"
    | "billet_assignment"
    | "department_assignment"
    | "campaign"
    | "event"
    | "operation"
    | "announcement"
    | "event_series";

interface AuditLogInput {
    actorId?: string | null;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityLabel?: string | null;
    targetTrooperId?: string | null;
    previousData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
}

// Fire-and-forget — audit failures must never break the calling action
export async function createAuditLog(input: AuditLogInput): Promise<void> {
    try {
        await db.insert(auditLogs).values({
            actorId: input.actorId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            entityLabel: input.entityLabel ?? null,
            targetTrooperId: input.targetTrooperId ?? null,
            previousData: input.previousData ?? null,
            newData: input.newData ?? null,
            metadata: input.metadata ?? null,
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

export interface AuditLogFilters {
    actorId?: string;
    entityType?: AuditEntityType;
    targetTrooperId?: string;
    from?: Date;
    to?: Date;
}

export async function getAuditLogs(
    filters: AuditLogFilters = {},
    page = 1,
    pageSize = 50
) {
    try {
        const conditions: SQL[] = [];

        if (filters.actorId) {
            conditions.push(eq(auditLogs.actorId, filters.actorId));
        }
        if (filters.entityType) {
            conditions.push(eq(auditLogs.entityType, filters.entityType));
        }
        if (filters.targetTrooperId) {
            conditions.push(
                eq(auditLogs.targetTrooperId, filters.targetTrooperId)
            );
        }

        const rows = await db.query.auditLogs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: desc(auditLogs.createdAt),
            limit: pageSize,
            offset: (page - 1) * pageSize,
            with: {
                actor: {
                    columns: { id: true, name: true, numbers: true },
                    with: { rank: { columns: { abbreviation: true } } },
                },
                targetTrooper: {
                    columns: { id: true, name: true, numbers: true },
                    with: { rank: { columns: { abbreviation: true } } },
                },
            },
        });

        return rows;
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return [];
    }
}
