"use server";

import { revalidateTag, unstable_noStore } from "next/cache";
import { db } from "@/db/index";
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
import {
    addDepartmentsToTrooper,
    getTroopersDepartmentPositions,
    removeDepartmentsFromTrooper,
} from "@/services/departments";

const formSchema = z
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
        departments: z.array(z.string()).optional(),
    })
    .refine(
        (data) => {
            if (data.status === "Discharged") {
                return data.billet == null;
            }
            return true;
        },
        {
            message: "Discharged troopers cannot have a billet assignment",
            path: ["billet"],
        }
    )
    .refine(
        (data) => {
            if (data.status === "Discharged") {
                return (
                    data.departments == null || data.departments.length === 0
                );
            }
            return true;
        },
        {
            message: "Discharged troopers must have no department positions",
            path: ["departments"],
        }
    );

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

        if (rawFormData.departments) {
            const result = await addDepartmentsToTrooper(
                resultingTrooper.id,
                rawFormData.departments
            );
            if (!result) {
                return { error: "Failed to add departments to trooper" };
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

        console.log("billetIdRequested: ", billetIdRequested);
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

        if (rawFormData.departments) {
            console.log("rawFormData.departments: ", rawFormData.departments);
            const { error } = await handleDepartmentUpdate(
                resultingTrooper.id,
                rawFormData.departments
            );
            if (error) {
                console.log("handleDepartmentUpdate error: ", error);
                return { error: "Failed to update departments" };
            }
        }

        return { id: resultingTrooper.id };
    } catch (error) {
        return { error: error };
    }
}

async function handleDepartmentUpdate(
    trooperId: string,
    departments: string[]
) {
    const currentDepartments = await getTroopersDepartmentPositions(trooperId);
    if (!currentDepartments) {
        return {
            error: "Failed to get current departments inside of handleDepartmentUpdate",
        };
    }
    const currentDepartmentIds = currentDepartments?.map(
        (department) => department.positionId
    );
    const departmentsToAdd = departments.filter(
        (department) => !currentDepartmentIds.includes(department)
    );
    const departmentsToRemove = currentDepartmentIds.filter(
        (department) => !departments.includes(department)
    );
    console.log("departmentsToAdd: ", departmentsToAdd);
    console.log("departmentsToRemove: ", departmentsToRemove);
    if (departmentsToAdd.length > 0) {
        const didDepartmentsAdd = await addDepartmentsToTrooper(
            trooperId,
            departmentsToAdd
        );
        if (!didDepartmentsAdd) {
            return { error: "Failed to add departments to trooper" };
        }
    }
    if (departmentsToRemove.length > 0) {
        const didDepartmentsRemove = await removeDepartmentsFromTrooper(
            trooperId,
            departmentsToRemove
        );
        if (!didDepartmentsRemove) {
            return { error: "Failed to remove departments from trooper" };
        }
    }
    console.log("Successfully updated departments");
    return { success: true };
}

export async function refresh() {
    revalidateTag("troopers");
    revalidateTag("billets");
    revalidateTag("departments");
    revalidateTag("troopers-status-counts");
}
