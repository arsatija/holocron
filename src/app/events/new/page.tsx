import { db } from "@/db";
import { troopers, qualifications, campaigns } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import CreateEventForm from "./_components/create-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
    const [troopersList, qualsList, campaignsList] = await Promise.all([
        db
            .select({
                id: troopers.id,
                name: troopers.name,
                numbers: troopers.numbers,
                rank: troopers.rank,
            })
            .from(troopers)
            .where(eq(troopers.status, "Active"))
            .orderBy(asc(troopers.numbers)),
        db
            .select({
                id: qualifications.id,
                name: qualifications.name,
                abbreviation: qualifications.abbreviation,
            })
            .from(qualifications)
            .orderBy(asc(qualifications.name)),
        db
            .select({
                id: campaigns.id,
                name: campaigns.name,
            })
            .from(campaigns)
            .where(eq(campaigns.isActive, true))
            .orderBy(asc(campaigns.name)),
    ]);

    return (
        <CreateEventForm
            troopers={troopersList}
            qualifications={qualsList}
            campaigns={campaignsList}
        />
    );
}
