"use server"

import { revalidateTag, unstable_noStore } from "next/cache"
import { db } from "@/db/index"
import {
    NewBilletAssignment,
    NewTrooper,
    troopers,
    type Trooper,
} from "@/db/schema";
import { takeFirstOrThrow } from "@/db/utils";
import { asc, eq, inArray, not } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { getErrorMessage } from "@/lib/handle-error";
import { ranks } from "@/lib/definitions";
import { createTrooper, updateTrooper } from "@/services/troopers";
import {
    createBilletAssignment,
    removeBilletAssignment,
} from "@/services/billets";

import { formSchema } from "./validations";

export async function create(formData: z.infer<typeof formSchema>) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);

        // example name: 0000 "Disney"
        const [numbers, name] = rawFormData.name.split(" ");
        const trooperName = name.replace(/"/g, "").toLowerCase();

        const trooper: NewTrooper = {
            numbers: parseInt(numbers),
            name: trooperName[0].toUpperCase() + trooperName.slice(1),
            rank: rawFormData.rank,
            status: rawFormData.status,
            recruitmentDate: rawFormData.recruitmentDate.toISOString(),
        };

        const resultingTrooper = await createTrooper(trooper);

        if (!resultingTrooper) {
            return { error: "Failed to create trooper" };
        }

        const billetIdRequested = rawFormData.billet;
        const billetAssignment = {
            trooperId: resultingTrooper.id,
            billetId: billetIdRequested,
        };

        if (billetIdRequested) {
            const { error } = await createBilletAssignment(
                billetAssignment as NewBilletAssignment
            );
            if (error) {
                return { error };
            }
        } else {
            const { error } = await removeBilletAssignment(resultingTrooper.id);
            if (error) {
                return { error };
            }
        }

        return { id: resultingTrooper.id };
    } catch (error) {
        return { error: error };
    }
}

export async function update(formData: z.infer<typeof formSchema>) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);

        console.log("edit rawFormData: ", rawFormData);

        // example name: 0000 "Disney"
        const [numbers, name] = rawFormData.name.split(" ");
        const trooperName = name.replace(/"/g, "").toLowerCase();

        const trooper: NewTrooper = {
            id: rawFormData.id,
            numbers: parseInt(numbers),
            name: trooperName[0].toUpperCase() + trooperName.slice(1),
            rank: rawFormData.rank,
            status: rawFormData.status,
            recruitmentDate: rawFormData.recruitmentDate.toISOString(),
        };

        const resultingTrooper = await updateTrooper(trooper);

        console.log("resultingTrooper: ", resultingTrooper);

        if (!resultingTrooper) {
            return { error: "Failed to create trooper" };
        }

        const billetIdRequested = rawFormData.billet;
        const billetAssignment = {
            trooperId: resultingTrooper.id,
            billetId: billetIdRequested == "" ? undefined : billetIdRequested,
        };

        console.log("billetAssignemnt: ", billetAssignment);

        if (billetIdRequested) {
            const { error } = await createBilletAssignment(
                billetAssignment as NewBilletAssignment
            );
            if (error) {
                return { error };
            }
        } else {
            const { success, error } = await removeBilletAssignment(
                resultingTrooper.id
            );
            if (success) {
                console.log("billet removed");
            } else if (error) {
                return { error };
            }
        }

        return { id: resultingTrooper.id };
    } catch (error) {
        return { error: error };
    }
}

