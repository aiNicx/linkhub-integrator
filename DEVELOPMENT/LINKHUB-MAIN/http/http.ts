import { httpRouter } from "convex/server";

// Importa tutti gli endpoint modulari
import { token } from "./http/auth";
import { openidConfiguration, jwks, authorize } from "./http/oauth";
import { webhook } from "./http/resend";
import { generateTestToken } from "./http/testAuth";
import { listTeams } from "./http/teams";
import { listIndicators, getIndicator, createIndicator, updateIndicator } from "./http/indicators";
import { getCompany } from "./http/companies";
import { listInitiatives, getInitiative, createInitiative, updateInitiative, updateInitiativeStatus } from "./http/initiatives";

const http = httpRouter();

// OAuth Discovery endpoints
http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: openidConfiguration,
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: jwks,
});

// OAuth authorize endpoint
http.route({
  path: "/oauth/authorize",
  method: "GET",
  handler: authorize,
});

// Authentication endpoint
http.route({
  path: "/auth/token",
  method: "POST",
  handler: token,
});

// Resend webhook endpoint
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: webhook,
});

// Test endpoint (solo development)
http.route({
  path: "/test/generate-token",
  method: "POST",
  handler: generateTestToken,
});

// API Integrator endpoints
http.route({
  path: "/api/teams",
  method: "GET",
  handler: listTeams,
});

http.route({
  path: "/api/indicators",
  method: "GET",
  handler: listIndicators,
});

http.route({
  pathPrefix: "/api/indicators/",
  method: "GET",
  handler: getIndicator,
});

http.route({
  path: "/api/indicators",
  method: "POST",
  handler: createIndicator,
});

http.route({
  pathPrefix: "/api/indicators/",
  method: "PUT",
  handler: updateIndicator,
});

http.route({
  pathPrefix: "/api/companies/",
  method: "GET",
  handler: getCompany,
});

// API Initiatives endpoints
http.route({
  path: "/api/initiatives",
  method: "GET",
  handler: listInitiatives,
});

http.route({
  pathPrefix: "/api/initiatives/",
  method: "GET",
  handler: getInitiative,
});

http.route({
  path: "/api/initiatives",
  method: "POST",
  handler: createInitiative,
});

http.route({
  pathPrefix: "/api/initiatives/",
  method: "PUT",
  handler: updateInitiative,
});

http.route({
  pathPrefix: "/api/initiatives/",
  method: "PATCH",
  handler: updateInitiativeStatus,
});

export default http;