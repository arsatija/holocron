import { ranks, troopers, type Trooper } from "@/db/schema";
import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

export const searchParamsCache = createSearchParamsCache({
    flags: parseAsArrayOf(z.enum(["advancedTable"])).withDefault([]),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<Trooper>().withDefault([
        { id: "rank", desc: false },
    ]),
    name: parseAsString.withDefault(""),
    numbers: parseAsString.withDefault(""),
    status: parseAsArrayOf(z.enum(troopers.status.enumValues)).withDefault([]),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    // advanced filter
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetPlayersSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;

export const formSchema = z
    .object({
        id: z.string().optional(),
        name: z
            .string()
            .regex(
                /^\d{4}\s"[^"]*"$/,
                'It is IMPERATIVE that you use the following format: 0000 "Name" [Ex. 0000 "Disney"]'
            )
            .refine(
                async (data) => {
                    if (data == "" || !data.includes(" ")) return false;
                    const [numbers, name] = data.split(" ");
                    const recruitName = name.replace(/"/g, "").toLowerCase();
                    return parseInt(numbers) >= 1000;
                },
                { message: "This name or number is already taken." }
            ),
        status: z.enum(["Active", "Inactive", "Discharged"]).default("Active"),
        rank: z.number().min(1).max(Object.keys(ranks).length),
        recruitmentDate: z
            .date({
                required_error: "Recruitment date is required.",
            })
            .default(new Date()),
        billet: z.string().nullable().optional(),
    })
    .refine(
        (data) => {
            if (data.status === "Discharged") {
                return data.billet === null;
            }
            return true;
        },
        {
            message: "Discharged troopers cannot have a billet assignment",
            path: ["billet"],
        }
    );
