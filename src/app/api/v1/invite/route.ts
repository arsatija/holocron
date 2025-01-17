import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invites } from '@/db/schema';
import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trooperId } = body;

    if (!trooperId) {
      return NextResponse.json({ error: 'Trooper ID is required' }, { status: 400 });
    }

    // Generate a unique invite code
    const inviteCode = nanoid();

    // Store the invite in the database
    const [invite] = await db
      .insert(invites)
      .values({
        code: inviteCode,
        trooperId,
        expiresAt: addDays(new Date(), 7)
      })
      .returning();

    // Return the generated invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invite.code}`;
    return NextResponse.json({ inviteLink }, { status: 201 });
  } catch (error) {
    console.error('Error generating invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
