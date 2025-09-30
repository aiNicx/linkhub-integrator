import NextAuth from "next-auth"
import Auth0 from "next-auth/providers/auth0"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Auth0({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          audience: "https://linkhub-api", // Stessa audience di LinkHub principale
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Preserva il JWT originale di Auth0 per compatibilità con LinkHub
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      // Aggiungi informazioni necessarie alla session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
        session.provider = token.provider as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
})