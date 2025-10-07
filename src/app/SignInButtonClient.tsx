"use client";

import { signIn } from "next-auth/react";

export function SignInButtonClient() {
  return (
    <button
      onClick={() => signIn("auth0", { callbackUrl: "/dashboard" })}
      className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 font-medium transition-colors"
    >
      Accedi con Auth0
    </button>
  );
}
