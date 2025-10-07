/**
 * 🔌 HUBSPOT ADAPTER
 * 
 * Sincronizza Deals da HubSpot → LinkHub (Indicators + Values + Initiatives)
 */

import {
  IntegrationAdapter,
  Credentials,
  FetchParams,
  FetchResult,
  SyncRecord,
  LinkHubRecord,
  PushResult,
} from "./types";

// ============================================================================
// HUBSPOT CONFIG
// ============================================================================

interface HubSpotConfig {
  portalId?: string;             // ID del portale HubSpot
  pipelineId?: string;           // ID della pipeline da sincronizzare
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    closedate: string;
    dealstage: string;
    hubspot_owner_id?: string;
    hs_lastmodifieddate: string;
  };
}

// ============================================================================
// HUBSPOT ADAPTER
// ============================================================================

export class HubSpotAdapter implements IntegrationAdapter {
  private readonly BASE_URL = "https://api.hubspot.com";

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  async authenticate(credentials: Credentials): Promise<boolean> {
    if (!credentials.accessToken) {
      return false;
    }

    try {
      // Verifica validità token chiamando API HubSpot
      const response = await fetch(
        `${this.BASE_URL}/oauth/v1/access-tokens/${credentials.accessToken}`
      );

      return response.ok;
    } catch (error) {
      console.error("HubSpot auth error:", error);
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<Credentials> {
    // Implementa refresh token OAuth2 HubSpot
    const response = await fetch(`${this.BASE_URL}/oauth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh HubSpot token");
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  // ==========================================================================
  // FETCH RECORDS (IMPORT)
  // ==========================================================================

  async fetchRecords(params: FetchParams): Promise<FetchResult> {
    const { credentials, config, lastModifiedCursor, batchSize = 100 } = params;
    const hubspotConfig = config as HubSpotConfig | undefined;

    if (!credentials.accessToken) {
      throw new Error("HubSpot access token required");
    }

    try {
      // Costruisci URL con filtri e pagination
      let url = `${this.BASE_URL}/crm/v3/objects/deals?limit=${batchSize}`;

      // Sync incrementale: filtra per ultima modifica
      if (lastModifiedCursor) {
        url += `&after=${lastModifiedCursor}`;
      }

      // Filtro per pipeline specifica (se configurato)
      if (hubspotConfig?.pipelineId) {
        url += `&properties=pipeline&filters=${JSON.stringify([
          {
            propertyName: "pipeline",
            operator: "EQ",
            value: hubspotConfig.pipelineId,
          },
        ])}`;
      }

      // Richiedi properties necessarie
      url += "&properties=dealname,amount,closedate,dealstage,hubspot_owner_id,hs_lastmodifieddate";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      const data = await response.json();
      const deals: HubSpotDeal[] = data.results || [];

      // Trasforma ogni deal in multi-entity record
      const records: SyncRecord[] = deals.map((deal) =>
        this.transformDealToMultiEntity(deal)
      );

      return {
        records,
        nextCursor: data.paging?.next?.after, // Cursor per prossimo batch
        hasMore: !!data.paging?.next?.after,
      };
    } catch (error) {
      console.error("HubSpot fetch error:", error);
      throw error;
    }
  }

  // ==========================================================================
  // TRANSFORM DEAL → MULTI-ENTITY
  // ==========================================================================

  private transformDealToMultiEntity(deal: HubSpotDeal): SyncRecord {
    return {
      type: "multi",
      entities: [
        // 1. Indicator (KPI Revenue per questo deal)
        {
          linkhubEntity: "indicators",
          externalId: `hubspot_deal_indicator_${deal.id}`,
          data: {
            description: `Revenue: ${deal.properties.dealname}`,
            symbol: "€",
            periodicity: "monthly",
            // Metadata per tracking
            _externalSource: "hubspot",
            _externalId: deal.id,
            _externalType: "deal",
          },
        },

        // 2. Value (valore del deal al closedate)
        {
          linkhubEntity: "values",
          externalId: `hubspot_deal_value_${deal.id}`,
          data: {
            value: this.parseAmount(deal.properties.amount),
            date: this.parseDate(deal.properties.closedate),
          },
          // Questo Value ha bisogno dell'indicatorId creato dall'entità sopra
          dependsOn: {
            entity: "indicators",
            index: 0,
            fieldName: "indicatorId", // Campo dove iniettare l'ID
          },
        },

        // 3. Initiative (iniziativa per chiudere questo deal)
        {
          linkhubEntity: "initiatives",
          externalId: `hubspot_deal_initiative_${deal.id}`,
          data: {
            description: deal.properties.dealname,
            status: this.mapDealStageToStatus(deal.properties.dealstage),
            priority: this.inferPriorityFromAmount(deal.properties.amount),
            checkInDays: 7,
            // Note con link al deal HubSpot
            notes: `Deal HubSpot: https://app.hubspot.com/contacts/${deal.id}/deal/${deal.id}`,
            // Metadata
            _externalSource: "hubspot",
            _externalId: deal.id,
            _externalType: "deal",
          },
        },
      ],
    };
  }

  // ==========================================================================
  // HELPER METHODS (TRANSFORMATIONS)
  // ==========================================================================

  private parseAmount(amount: string): number {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }

  private parseDate(dateString: string): number {
    const date = new Date(dateString);
    return date.getTime();
  }

  private mapDealStageToStatus(
    dealstage: string
  ): "ON_TIME" | "OVERDUE" | "FINISHED" {
    const stage = dealstage.toLowerCase();

    // Mapping stage HubSpot → status LinkHub
    const stageMap: Record<string, "ON_TIME" | "OVERDUE" | "FINISHED"> = {
      appointmentscheduled: "ON_TIME",
      qualifiedtobuy: "ON_TIME",
      presentationscheduled: "ON_TIME",
      decisionmakerboughtin: "ON_TIME",
      contractsent: "ON_TIME",
      closedwon: "FINISHED",
      closedlost: "FINISHED",
    };

    return stageMap[stage] || "ON_TIME";
  }

  private inferPriorityFromAmount(
    amount: string
  ): "lowest" | "low" | "medium" | "high" | "highest" {
    const value = this.parseAmount(amount);

    // Priorità basata sull'importo del deal
    if (value >= 100000) return "highest";
    if (value >= 50000) return "high";
    if (value >= 10000) return "medium";
    if (value >= 1000) return "low";
    return "lowest";
  }

  // ==========================================================================
  // PUSH RECORDS (EXPORT) - Opzionale
  // ==========================================================================

  async pushRecords(_records: LinkHubRecord[]): Promise<PushResult> {
    // Implementa export da LinkHub → HubSpot
    // Per MVP, può essere non implementato
    // Evita warning linter utilizzando la lunghezza per un log opzionale
    console.warn(`HubSpot export non implementato. Records ricevuti: ${_records.length}`);
    throw new Error("HubSpot export not implemented yet");
  }

  // ==========================================================================
  // CONFIG VALIDATION
  // ==========================================================================

  validateConfig(config: unknown): { valid: boolean; error?: string } {
    const hubspotConfig = config as HubSpotConfig | undefined;

    // Config è opzionale per HubSpot
    if (!hubspotConfig) {
      return { valid: true };
    }

    // Valida portalId se presente
    if (hubspotConfig.portalId && typeof hubspotConfig.portalId !== "string") {
      return { valid: false, error: "portalId must be a string" };
    }

    // Valida pipelineId se presente
    if (
      hubspotConfig.pipelineId &&
      typeof hubspotConfig.pipelineId !== "string"
    ) {
      return { valid: false, error: "pipelineId must be a string" };
    }

    return { valid: true };
  }
}

