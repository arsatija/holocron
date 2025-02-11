"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { User } from "next-auth";

export async function linkUserToTrooper(inviteCode: string, user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }) {
    if (!inviteCode) {
        console.error('Invite code is missing');
        return false;
      }

      if (!user.name) {
        console.error('User name is missing');
        return false;
      }

      const result = await db.transaction(async (tx) => {
        // Validate invite code
        const invitesResult = await tx
        .select()
        .from(invites)
        .where(eq(invites.code, inviteCode))

      const invite = invitesResult[0];

      if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) {
        console.error('Invalid or expired invite code');
        return false;
      }

      // Check if user already exists
      const existingUser = await tx
        .select()
        .from(users)
        .where(eq(users.name, user.name!))

      if (existingUser.length > 0) {
        console.error('User already exists');
        return false;
      }

      // Create a new user
      await tx.insert(users).values({
        name: user.name!,
        trooperId: invite.trooperId,
      });

      // Mark invite as used
        await tx.delete(invites).where(eq(invites.code, inviteCode));

        return true;
      });
      return result;
}

export async function getTrooperByAccount(name: string) {
    const user = await db.select().from(users).where(eq(users.name, name));
    return user[0] ?? null;
}