import NextAuth, {type NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

const ALLOWED_HOSTS = ["9thac.com", "www.9thac.com", "holocron.9thac.com"]

const isProd = process.env.NODE_ENV === "production"

const authOptions: NextAuthOptions = {
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
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        const { host } = new URL(url)
        if (ALLOWED_HOSTS.includes(host)) return url
      } catch {}
      return baseUrl
    },
  },
  ...(isProd && {
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain: ".9thac.com",
        },
      },
    },
  }),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
