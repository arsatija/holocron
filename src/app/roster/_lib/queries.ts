import "server-only";

import { db } from "@/db";
import { players, type Player } from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  gt,
  gte,
  ilike,
  inArray,
  lte,
} from "drizzle-orm";

import { filterColumns } from "@/lib/filter-columns";
import { unstable_cache } from "@/lib/unstable-cache";

import { type GetPlayersSchema } from "./validations";

export async function getPlayers(input: GetPlayersSchema) {
  return await unstable_cache(
    async () => {
      try {
        const offset = (input.page - 1) * input.perPage;
        const fromDate = input.from ? new Date(input.from) : undefined;
        const toDate = input.to ? new Date(input.to) : undefined;
        const advancedTable = input.flags.includes("advancedTable");

        const advancedWhere = filterColumns({
          table: players,
          filters: input.filters,
          joinOperator: input.joinOperator,
        });

        const where = advancedTable
          ? advancedWhere
          : and(
              input.name ? ilike(players.name, `%${input.name}%`) : undefined,
              input.numbers
                ? ilike(players.numbers, `%${input.numbers}%`)
                : undefined,
              input.status.length > 0
                ? inArray(players.status, input.status)
                : undefined,
              fromDate
                ? gte(players.recruitmentDate, fromDate.toISOString())
                : undefined,
              toDate
                ? lte(players.recruitmentDate, toDate.toISOString())
                : undefined
            );

        const orderBy =
          input.sort.length > 0
            ? input.sort.map((item) =>
                item.desc ? desc(players[item.id]) : asc(players[item.id])
              )
            : [asc(players.recruitmentDate)];

        const { data, total } = await db.transaction(async (tx) => {
          const data = await tx
            .select()
            .from(players)
            .limit(input.perPage)
            .offset(offset)
            .where(where)
            .orderBy(...orderBy);

          const total = await tx
            .select({
              count: count(),
            })
            .from(players)
            .where(where)
            .execute()
            .then((res) => res[0]?.count ?? 0);
          return {
            data,
            total,
          };
        });

        const pageCount = Math.ceil(total / input.perPage);
        return { data, pageCount };
      } catch (error) {
        console.error("Error fetching players: ", error)
        return { data: [], pageCount: 0 };
      }
    },
    [JSON.stringify(input)],
    {
      revalidate: 3600,
      tags: ["players"],
    }
  )();
}

export async function getPlayerStatusCounts() {
  return unstable_cache(
    async () => {
      try {
        return await db
          .select({
            status: players.status,
            count: count(),
          })
          .from(players)
          .groupBy(players.status)
          .having(gt(count(), 0))
          .then((res) =>
            res.reduce((acc, { status, count }) => {
              acc[status] = count;
              return acc;
            }, {} as Record<Player["status"], number>)
          );
      } catch (err) {
        return {} as Record<Player["status"], number>;
      }
    },
    ["players-status-counts"],
    {
      revalidate: 3600,
    }
  )();
}
