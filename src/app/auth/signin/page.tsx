import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignInClient } from "./SignInClient"

export default async function SignInPage() {
  // Se l'utente è già autenticato, reindirizza alla dashboard
  const session = await auth()
  if (session) {
    redirect("/dashboard")
  }

  return <SignInClient />
}