export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiParamLocation = "path" | "query" | "header" | "body";

export interface ApiParameter {
  name: string;
  in: ApiParamLocation;
  required?: boolean;
  description?: string;
  schema?: unknown;
  example?: unknown;
}

export interface ApiResponseExample {
  status: number;
  description?: string;
  body: unknown;
}

export interface ApiEndpoint {
  id: string;
  title: string;
  method: HttpMethod;
  path: string;
  description?: string;
  headers?: ApiParameter[];
  parameters?: ApiParameter[];
  requestBodyExample?: unknown;
  responses: ApiResponseExample[];
  tags?: string[];
}

export interface ApiSection {
  id: string;
  title: string;
  description?: string;
  endpoints: ApiEndpoint[];
}

export interface ApiReference {
  version: string;
  auth: {
    scheme: string;
    header: string;
    description?: string;
  };
  sections: ApiSection[];
}

export const apiReference: ApiReference = {
  version: "v1",
  auth: {
    scheme: "JWT",
    header: "Authorization: Bearer <JWT_TOKEN>",
    description:
      "Tutti gli endpoint richiedono autenticazione tramite JWT nell'header Authorization",
  },
  sections: [
    {
      id: "teams",
      title: "Teams",
      description:
        "Recupero e gestione dei teams associati alla company dell'utente autenticato",
      endpoints: [
        {
          id: "get-teams",
          title: "Lista Teams",
          method: "GET",
          path: "/api/teams",
          description:
            "Recupera la lista di tutti i teams della company associata all'utente autenticato",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            {
              status: 200,
              body: {
                success: true,
                data: {
                  teams: [
                    {
                      id: "team_id_123",
                      name: "Engineering Team",
                      slug: "engineering-team",
                      impact: 100,
                      type: "FUNCTIONAL",
                      teamLeader: {
                        id: "user_id_456",
                        name: "John",
                        surname: "Doe",
                        email: "john.doe@company.com",
                      },
                      cluster: {
                        id: "cluster_id_789",
                        name: "Tech Cluster",
                        slug: "tech-cluster",
                      },
                      createdAt: 1704067200000,
                    },
                  ],
                },
                timestamp: 1704067200000,
              },
            },
          ],
          tags: ["Teams"],
        },
      ],
    },
    {
      id: "indicators",
      title: "Indicators",
      description: "Gestione e consultazione degli indicatori (KPI)",
      endpoints: [
        {
          id: "list-indicators",
          title: "Lista Indicators",
          method: "GET",
          path: "/api/indicators",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            {
              status: 200,
              body: {
                success: true,
                data: {
                  indicators: [
                    {
                      id: "indicator_id_123",
                      description: "Revenue mensile",
                      symbol: "€",
                      slug: "revenue-mensile",
                      periodicity: "monthly",
                      automationUrl: "https://...",
                      automationDescription: "...",
                      notes: "...",
                      isReverse: false,
                      assignee: {
                        id: "user_id",
                        name: "John",
                        email: "john@company.com",
                        image: "...",
                      },
                      values: [{ _id: "...", value: 50000, date: 1704067200000 }],
                      createdAt: 1704067200000,
                    },
                  ],
                },
                timestamp: 1704067200000,
              },
            },
          ],
          tags: ["Indicators"],
        },
        {
          id: "get-indicator",
          title: "Dettaglio Indicator",
          method: "GET",
          path: "/api/indicators/:indicatorId",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            {
              status: 200,
              body: {
                success: true,
                data: {
                  indicator: {
                    id: "indicator_id_123",
                    description: "Revenue mensile",
                    symbol: "€",
                    slug: "revenue-mensile",
                    periodicity: "monthly",
                    automationUrl: "https://...",
                    automationDescription: "...",
                    notes: "...",
                    isReverse: false,
                    assigneeId: "user_id",
                    createdAt: 1704067200000,
                  },
                },
                timestamp: 1704067200000,
              },
            },
          ],
          tags: ["Indicators"],
        },
        {
          id: "create-indicator",
          title: "Crea Indicator",
          method: "POST",
          path: "/api/indicators",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
            { name: "Content-Type", in: "header", required: true, example: "application/json" },
          ],
          requestBodyExample: {
            description: "Revenue mensile",
            symbol: "€",
            periodicity: "monthly",
            assigneeId: "user_id_optional",
            automationUrl: "https://... (optional)",
            automationDescription: "... (optional)",
            notes: "... (optional)",
            isReverse: false,
          },
          responses: [
            {
              status: 201,
              body: { success: true, data: { indicatorId: "new_indicator_id" }, timestamp: 1704067200000 },
            },
          ],
          tags: ["Indicators"],
        },
        {
          id: "update-indicator",
          title: "Aggiorna Indicator",
          method: "PUT",
          path: "/api/indicators/:indicatorId",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
            { name: "Content-Type", in: "header", required: true, example: "application/json" },
          ],
          requestBodyExample: {
            description: "Revenue mensile aggiornato (optional)",
            symbol: "€ (optional)",
            periodicity: "quarterly (optional)",
            assigneeId: "user_id (optional, null per rimuovere)",
            automationUrl: "... (optional)",
            automationDescription: "... (optional)",
            notes: "... (optional)",
            isReverse: true,
          },
          responses: [
            { status: 200, body: { success: true, data: { indicatorId: "indicator_id" }, timestamp: 1704067200000 } },
          ],
          tags: ["Indicators"],
        },
      ],
    },
    {
      id: "companies",
      title: "Companies",
      description: "Dettagli e configurazioni della company",
      endpoints: [
        {
          id: "get-company",
          title: "Dettaglio Company",
          method: "GET",
          path: "/api/companies/:companyId",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            {
              status: 200,
              body: {
                success: true,
                data: {
                  company: {
                    id: "company_id_123",
                    name: "Company Name",
                    slug: "company-slug",
                    mission: "La nostra missione...",
                    vision: "La nostra visione...",
                    createdAt: 1704067200000,
                  },
                },
                timestamp: 1704067200000,
              },
            },
          ],
          tags: ["Companies"],
        },
      ],
    },
    {
      id: "initiatives",
      title: "Initiatives",
      description: "Gestione delle iniziative e del loro stato",
      endpoints: [
        {
          id: "list-initiatives",
          title: "Lista Initiatives",
          method: "GET",
          path: "/api/initiatives",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            { status: 200, body: { success: true, data: { initiatives: [] }, timestamp: 1704067200000 } },
          ],
          tags: ["Initiatives"],
        },
        {
          id: "get-initiative",
          title: "Dettaglio Initiative",
          method: "GET",
          path: "/api/initiatives/:initiativeId",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
          ],
          responses: [
            { status: 200, body: { success: true, data: { initiative: {} }, timestamp: 1704067200000 } },
          ],
          tags: ["Initiatives"],
        },
        {
          id: "create-initiative",
          title: "Crea Initiative",
          method: "POST",
          path: "/api/initiatives",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
            { name: "Content-Type", in: "header", required: true, example: "application/json" },
          ],
          requestBodyExample: {
            description: "Migliorare performance API",
            teamId: "team_id_789",
            assigneeId: "user_id_456",
            checkInDays: 7,
            priority: "high",
            status: "ON_TIME",
            riskId: "risk_id_101",
            notes: "Focus su ottimizzazione database queries",
            externalUrl: "https://jira.company.com/issue/123",
          },
          responses: [
            { status: 201, body: { success: true, data: { initiativeId: "new_initiative_id", slug: "migliorare-performance-api" }, timestamp: 1704067200000 } },
          ],
          tags: ["Initiatives"],
        },
        {
          id: "update-initiative",
          title: "Aggiorna Initiative",
          method: "PUT",
          path: "/api/initiatives/:initiativeId",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
            { name: "Content-Type", in: "header", required: true, example: "application/json" },
          ],
          requestBodyExample: {
            description: "Migliorare performance API - Aggiornato",
            assigneeId: "user_id_456",
            checkInDays: 14,
            priority: "highest",
            status: "ON_TIME",
            riskId: "risk_id_101",
            notes: "Priorità aumentata per criticità",
            externalUrl: "https://jira.company.com/issue/123",
          },
          responses: [
            { status: 200, body: { success: true, data: { initiativeId: "initiative_id_123" }, timestamp: 1704067200000 } },
          ],
          tags: ["Initiatives"],
        },
        {
          id: "patch-initiative-status",
          title: "Aggiorna solo Status Initiative",
          method: "PATCH",
          path: "/api/initiatives/:initiativeId/status",
          headers: [
            { name: "Authorization", in: "header", required: true, example: "Bearer <JWT_TOKEN>" },
            { name: "Content-Type", in: "header", required: true, example: "application/json" },
          ],
          requestBodyExample: { status: "FINISHED" },
          responses: [
            { status: 200, body: { success: true, data: { initiativeId: "initiative_id_123", status: "FINISHED" }, timestamp: 1704067200000 } },
          ],
          tags: ["Initiatives"],
        },
      ],
    },
  ],
};


