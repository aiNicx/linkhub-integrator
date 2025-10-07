/**
 * 🗂️ ADAPTER REGISTRY
 * 
 * Registry centralizzato di tutti gli adapter disponibili.
 * Per aggiungere una nuova integrazione, basta:
 * 1. Creare nuovo adapter (es. powerbi.ts)
 * 2. Registrarlo qui sotto
 */

import { IntegrationAdapter } from "./types";
import { HubSpotAdapter } from "./hubspot";

// ============================================================================
// REGISTRY
// ============================================================================

export const ADAPTER_REGISTRY: Record<string, IntegrationAdapter> = {
  hubspot: new HubSpotAdapter(),
  // 🆕 Aggiungi nuovi adapter qui:
  // powerbi: new PowerBIAdapter(),
  // planner: new PlannerAdapter(),
  // stripe: new StripeAdapter(),
};

// ============================================================================
// GET ADAPTER
// ============================================================================

/**
 * Ottiene adapter per provider slug
 * 
 * @throws Error se adapter non trovato
 */
export function getAdapter(providerSlug: string): IntegrationAdapter {
  const adapter = ADAPTER_REGISTRY[providerSlug];

  if (!adapter) {
    throw new Error(
      `Adapter not found for provider: ${providerSlug}. ` +
      `Available adapters: ${Object.keys(ADAPTER_REGISTRY).join(", ")}`
    );
  }

  return adapter;
}

/**
 * Controlla se adapter esiste per provider
 */
export function hasAdapter(providerSlug: string): boolean {
  return providerSlug in ADAPTER_REGISTRY;
}

/**
 * Lista tutti gli adapter disponibili
 */
export function listAdapters(): string[] {
  return Object.keys(ADAPTER_REGISTRY);
}

