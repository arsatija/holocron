"use server";

import { z } from "zod";
import { collectionFormSchema } from "./schema";
import {
    createWikiCollection,
    updateWikiCollection,
    deleteWikiCollection,
} from "@/services/wiki";
import { canManageWiki, getTrooperCtx } from "@/services/wiki-permissions";

async function requireWikiManager() {
    const ctx = await getTrooperCtx();
    if (!canManageWiki(ctx)) {
        throw new Error("You do not have permission to manage the wiki");
    }
    return ctx!;
}

export async function createCollectionAction(
    input: z.infer<typeof collectionFormSchema>
) {
    try {
        const ctx = await requireWikiManager();
        const data = collectionFormSchema.parse(input);
        return await createWikiCollection(
            {
                name: data.name,
                description: data.description ?? "",
                icon: data.icon ?? null,
                readPermissions: data.readPermissions,
                editPermissions: data.editPermissions,
            },
            ctx.id
        );
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create collection",
        };
    }
}

export async function updateCollectionAction(
    id: string,
    input: z.infer<typeof collectionFormSchema>
) {
    try {
        const ctx = await requireWikiManager();
        const data = collectionFormSchema.parse(input);
        return await updateWikiCollection(
            id,
            {
                name: data.name,
                description: data.description ?? "",
                icon: data.icon ?? null,
                readPermissions: data.readPermissions,
                editPermissions: data.editPermissions,
            },
            ctx.id
        );
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update collection",
        };
    }
}

export async function deleteCollectionAction(id: string) {
    try {
        const ctx = await requireWikiManager();
        return await deleteWikiCollection(id, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete collection",
        };
    }
}
