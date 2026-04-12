import "server-only";

import { db } from "@/db";
import { auditLogs, troopers, ranks } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { and, count, desc, asc, gte, lte, inArray, eq } from "drizzle-orm";
import { type GetAuditLogsSchema } from "./validations";
import { type AuditAction, type AuditEntityType } from "@/services/audit";

export type AuditLogEntry = {
    id: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityLabel: string | null;
    changedFields: string[] | null;
    createdAt: Date;
    actor: {
        id: string;
        name: string;
        numbers: number;
        rankAbbr: string | null;
    } | null;
    targetTrooper: {
        id: string;
        name: string;
        numbers: number;
        rankAbbr: string | null;
    } | null;
};

export async function getAuditLogsForTable(input: GetAuditLogsSchema): Promise<{
    data: AuditLogEntry[];
    pageCount: number;
    total: number;
}> {
    try {
        const actorTrooper = alias(troopers, "actor_trooper");
        const actorRank = alias(ranks, "actor_rank");
        const targetTrooper = alias(troopers, "target_trooper");
        const targetRank = alias(ranks, "target_rank");

        const offset = (input.page - 1) * input.perPage;
        const fromDate = input.from ? new Date(input.from) : undefined;
        const toDate = input.to ? new Date(input.to) : undefined;

        const where = and(
            input.action.length > 0
                ? inArray(auditLogs.action, input.action as AuditAction[])
                : undefined,
            input.entityType.length > 0
                ? inArray(
                      auditLogs.entityType,
                      input.entityType as AuditEntityType[]
                  )
                : undefined,
            fromDate ? gte(auditLogs.createdAt, fromDate) : undefined,
            toDate ? lte(auditLogs.createdAt, toDate) : undefined
        );

        const orderBy =
            input.sort.length > 0
                ? input.sort.map((item) =>
                      item.desc
                          ? desc(auditLogs.createdAt)
                          : asc(auditLogs.createdAt)
                  )
                : [desc(auditLogs.createdAt)];

        const [rows, totalResult] = await Promise.all([
            db
                .select({
                    id: auditLogs.id,
                    action: auditLogs.action,
                    entityType: auditLogs.entityType,
                    entityId: auditLogs.entityId,
                    entityLabel: auditLogs.entityLabel,
                    newData: auditLogs.newData,
                    createdAt: auditLogs.createdAt,
                    actorId: actorTrooper.id,
                    actorName: actorTrooper.name,
                    actorNumbers: actorTrooper.numbers,
                    actorRankAbbr: actorRank.abbreviation,
                    targetId: targetTrooper.id,
                    targetName: targetTrooper.name,
                    targetNumbers: targetTrooper.numbers,
                    targetRankAbbr: targetRank.abbreviation,
                })
                .from(auditLogs)
                .leftJoin(actorTrooper, eq(auditLogs.actorId, actorTrooper.id))
                .leftJoin(actorRank, eq(actorTrooper.rank, actorRank.id))
                .leftJoin(
                    targetTrooper,
                    eq(auditLogs.targetTrooperId, targetTrooper.id)
                )
                .leftJoin(targetRank, eq(targetTrooper.rank, targetRank.id))
                .where(where)
                .orderBy(...orderBy)
                .limit(input.perPage)
                .offset(offset),
            db.select({ count: count() }).from(auditLogs).where(where),
        ]);

        const data: AuditLogEntry[] = rows.map((row) => ({
            id: row.id,
            action: row.action,
            entityType: row.entityType,
            entityId: row.entityId,
            entityLabel: row.entityLabel,
            changedFields:
                row.action === "UPDATE" && row.newData && typeof row.newData === "object"
                    ? Object.keys(row.newData as Record<string, unknown>)
                    : null,
            createdAt: row.createdAt,
            actor: row.actorId
                ? {
                      id: row.actorId,
                      name: row.actorName!,
                      numbers: row.actorNumbers!,
                      rankAbbr: row.actorRankAbbr ?? null,
                  }
                : null,
            targetTrooper: row.targetId
                ? {
                      id: row.targetId,
                      name: row.targetName!,
                      numbers: row.targetNumbers!,
                      rankAbbr: row.targetRankAbbr ?? null,
                  }
                : null,
        }));

        const total = totalResult[0]?.count ?? 0;
        const pageCount = Math.ceil(total / input.perPage);

        return { data, pageCount, total };
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return { data: [], pageCount: 0, total: 0 };
    }
}
