"use server";

// Stubbed — no credentials yet.
// Wire up when GOOGLE_SERVICE_ACCOUNT_KEY is set in environment variables.

export interface CalendarEventInput {
    summary: string;
    description?: string;
    startDate: string; // ISO date string "YYYY-MM-DD"
    startTime?: string; // "HH:MM" UTC
    location?: string;
}

export async function createCalendarEvent(
    _event: CalendarEventInput
): Promise<string | null> {
    return null;
}

export async function updateCalendarEvent(
    _id: string,
    _event: CalendarEventInput
): Promise<void> {}

export async function deleteCalendarEvent(_id: string): Promise<void> {}
