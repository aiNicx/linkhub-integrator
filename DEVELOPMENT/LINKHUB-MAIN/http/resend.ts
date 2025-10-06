import { httpAction } from "../_generated/server";
import { resend } from "../emails";

export const webhook = httpAction(async (ctx, req) => {
  // Inoltra l'evento al gestore del componente Resend
  return await resend.handleResendEventWebhook(ctx, req);
});