import NextAuth from "next-auth"
import Auth0 from "next-auth/providers/auth0"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    provider?: string
  }

  interface JWT {
    accessToken?: string
    provider?: string
    sub?: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Auth0({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          audience: "https://linkhub-api", // API Auth0 condivisa
          scope: "openid profile email read:profile read:user read:company",
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
    async signIn({ user, account, profile }) {
      try {
        // Se è un login Auth0, crea automaticamente il profilo integrator
        if (account?.provider === "auth0") {
          console.log("Auth0 sign in - User:", user.email)
          console.log("Auth0 sign in - Profile:", profile?.sub)

          // Crea automaticamente il profilo integrator
          try {
            const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

            await convex.action(api.auth.ensureProfileExistsAction, {
              auth0UserId: (profile?.sub || user.id) as string,
              userEmail: user.email!,
              userName: user.name || undefined,
              accessToken: account.access_token || "",
            })

            console.log("Profilo integrator creato/aggiornato per:", user.email)
          } catch (convexError) {
            console.error("Errore creazione profilo Convex:", convexError)
            // Non bloccare il login se c'è un errore nella creazione del profilo
          }

          return true
        }

        return true
      } catch (error) {
        console.error("Errore durante sign in:", error)
        return false
      }
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