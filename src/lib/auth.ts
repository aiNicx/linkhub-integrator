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
          // Forza la schermata di login e scoraggia il signup
          prompt: "login",
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
        // Consenti solo login con Auth0 e solo per utenti già abilitati come Integrator
        if (account?.provider === "auth0") {
          const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
          const auth0UserId = (profile?.sub || user.id) as string

          try {
            const existing = await convex.query(api.auth.getProfileByAuth0UserId, {
              auth0UserId,
            })

            if (!existing) {
              // Nessun profilo Integrator: neghiamo l'accesso (no signup, no autocreazione)
              return false
            }
          } catch (e) {
            // In caso di errore nel check, per sicurezza blocchiamo l'accesso
            console.error("Errore verifica profilo Integrator:", e)
            return false
          }

          return true
        }

        return false
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