import { getCookie } from "cookies-next";
import NextAuth, { Account, Profile, User, type NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
      authorization: {
        url: 'https://discord.com/api/oauth2/authorize',
        params: {
          scope: 'identify',
        },
      },
    }),
  ],
  // callbacks: {
  //   async signIn({ account, profile }: { account: any; profile: {id: string, username?: string} }) {
  //     // const inviteCode = account?.params?.inviteCode;

  //     // if (!inviteCode) {
  //     //   console.error('Invite code is missing');
  //     //   return false;
  //     // }

  //     // const result = await db.transaction(async (tx) => {
  //     //   // Validate invite code
  //     //   const invitesResult = await tx
  //     //   .select()
  //     //   .from(invites)
  //     //   .where(eq(invites.code, inviteCode))

  //     // const invite = invitesResult[0];

  //     // if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) {
  //     //   console.error('Invalid or expired invite code');
  //     //   return false;
  //     // }

  //     // // Check if user already exists
  //     // const existingUser = await tx
  //     //   .select()
  //     //   .from(users)
  //     //   .where(eq(users.discordId, profile.id))

  //     // if (existingUser) {
  //     //   console.error('User already exists');
  //     //   return false;
  //     // }

  //     // // Create a new user
  //     // await tx.insert(users).values({
  //     //   discordId: profile.id,
  //     //   name: profile.username,
  //     //   trooperId: invite.trooperId,
  //     // });

  //     // // Mark invite as used
  //     //   await tx.delete(invites).where(eq(invites.code, inviteCode));

  //     //   return true;
  //     // });

  //     // return result;
  //     console.log('Account:', account);
  //     console.log('Profile:', profile);
  //     return true;
  //   },
  // },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
