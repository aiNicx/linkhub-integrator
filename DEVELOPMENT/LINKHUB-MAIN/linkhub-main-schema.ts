import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import type { Validator } from "convex/values";

// The users, accounts, sessions and verificationTokens tables are modeled
// from https://authjs.dev/getting-started/adapters#models

// 🔀 ENUMS - Convex usa v.union con v.literal per gli enum

// 🎯 PRIORITY SCHEMA - Usato per rischi e iniziative
export const PrioritySchema = v.union(
  v.literal("lowest"),
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("highest")
);

export const SkillCategorySchema = v.union(
  v.literal("EXECUTION"),
  v.literal("SOFT"),
  v.literal("STRATEGY")
);

export const OtoResultTypeSchema = v.union(
  v.literal("BELOW_STANDARD"),
  v.literal("STANDARD"),
  v.literal("ABOVE_STANDARD")
);

export const ResultTypeSchema = v.union(
  v.literal("BELOW_EXPECTATIONS"),
  v.literal("IN_LINE"),
  v.literal("ABOVE_EXPECTATIONS")
);

export const PersonalInitiativeStatusSchema = v.union(
  v.literal("ON_TIME"),
  v.literal("OVERDUE"),
  v.literal("FINISHED")
);

export const InitiativeStatusSchema = v.union(
  v.literal("ON_TIME"),
  v.literal("OVERDUE"),
  v.literal("FINISHED")
);

export const Session360StatusSchema = v.union(
  v.literal("planning"),
  v.literal("ongoing"),
  v.literal("finished")
);

export const FeedbackStatusSchema = v.union(
  v.literal("TO_BE_COMPLETED"),
  v.literal("SKIPPED"),
  v.literal("EVALUATED")
);

export const IntervalSourceSchema = v.union(
  v.literal("FROM_LAST_REPORT"),
  v.literal("FIRST_TRACKING"),
  v.literal("EDIT_MANUALLY")
);

export const ReportStatusSchema = v.union(
  v.literal("DRAFT"), // Creato ma non ancora inviato per la revisione.
  v.literal("IN_REVIEW"), // Inviato per la revisione o già in fase di revisione.
  v.literal("CLOSED_ABOVE_EXPECTATIONS"), // Chiuso con esito positivo (bonus ottenuto).
  v.literal("CLOSED_IN_LINE"), // Chiuso con esito standard.
  v.literal("CLOSED_BELOW_EXPECTATIONS") // Chiuso con esito negativo.
);

export const ReportPeriodSchema = v.union(
  v.literal("MONTHLY"), // Report con cadenza mensile.
  v.literal("QUARTERLY") // Report con cadenza trimestrale.
);

export const TeamTypeSchema = v.union(
  v.literal("FUNCTIONAL"),
  v.literal("PROJECTS"),
  v.literal("BACKLOG")
);

export const PeriodicitySchema = v.union(
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("semesterly"),
  v.literal("yearly")
);

// 👤 AUTH SCHEMAS

export const userSchema = {
  email: v.string(),
  name: v.optional(v.string()),
  emailVerified: v.optional(v.number()),
  image: v.optional(v.string()),

  // 🆕 CAMPI BUSINESS COMPLETI
  surname: v.optional(v.string()),
  password: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  avatar: v.optional(v.string()),
  deletedAt: v.optional(v.number()),
  theme: v.optional(
    v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
  ),
  roleId: v.optional(v.id("roles")),
  roleStep: v.optional(v.number()),
  mentorId: v.optional(v.id("users")),
  primaryCompanyId: v.optional(v.id("companies")),
  // 🔐 Amministratore globale (solo modificabile da DB/console Convex)
  isGlobalAdmin: v.optional(v.boolean()),

  // 🔑 RESET PASSWORD TOKENS
  resetPasswordToken: v.optional(v.string()),
  resetPasswordTokenExpiry: v.optional(v.number()),

  // 📧 INVITO UTENTI
  invitedAt: v.optional(v.number()), // Timestamp quando l'utente è stato invitato

  // 🔔 PREFERENZE NOTIFICHE
  notificationPreferences: v.optional(
    v.object({
      commentReceived: v.optional(v.boolean()), // Default: true
      commentRead: v.optional(v.boolean()), // Default: true
      thumbReactionReceived: v.optional(v.boolean()), // Default: true
    })
  ),
};

// ❌ sessionSchema rimosso - Non più necessario con JWT bridge

export const accountSchema = {
  userId: v.id("users"),
  type: v.union(
    v.literal("email"),
    v.literal("oidc"),
    v.literal("oauth"),
    v.literal("webauthn")
  ),
  provider: v.string(),
  providerAccountId: v.string(),
  refresh_token: v.optional(v.string()),
  access_token: v.optional(v.string()),
  expires_at: v.optional(v.number()),
  token_type: v.optional(v.string() as Validator<Lowercase<string>>),
  scope: v.optional(v.string()),
  id_token: v.optional(v.string()),
  session_state: v.optional(v.string()),
};

// ❌ verificationTokenSchema rimosso - Non più necessario con JWT bridge

export const authenticatorSchema = {
  credentialID: v.string(),
  userId: v.id("users"),
  providerAccountId: v.string(),
  credentialPublicKey: v.string(),
  counter: v.number(),
  credentialDeviceType: v.string(),
  credentialBackedUp: v.boolean(),
  transports: v.optional(v.string()),
};

// 🏢 BUSINESS LOGIC SCHEMAS COMPLETI

// 🎭 ROLE & COMPANY
export const roleSchema = {
  name: v.optional(v.string()), // Temporaneamente opzionale per la migrazione
  description: v.string(),
  minBonus: v.number(),
  maxBonus: v.optional(v.number()),
  companyId: v.id("companies"),
  performanceStandard: v.optional(v.number()),
  executionWeight: v.optional(v.number()),
  softSkillsWeight: v.optional(v.number()),
  strategyWeight: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const companySchema = {
  name: v.string(),
  slug: v.string(),
  mission: v.string(),
  vision: v.string(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()), // Per soft delete
  northStarKeyResultId: v.optional(v.id("keyResults")),
  potentialBonus: v.optional(v.number()),
  executionQuestion: v.optional(v.string()),
  // 🆕 NUOVI CAMPI per la configurazione centralizzata del reporting
  reportPeriod: v.optional(ReportPeriodSchema),
  reportExpirationDays: v.optional(v.number()),
  reviewExpirationDays: v.optional(v.number()),
  notificationAdvanceDays: v.optional(v.number()),
  // 🔧 MODULI OPZIONALI
  session360Enabled: v.optional(v.boolean()), // Controllo visibilità modulo Sessione 360
  integratorEnabled: v.optional(v.boolean()), // Se la company ha attivato LinkHub Integrator
  // 🔗 CONFIGURAZIONE INTEGRAZIONI
  integratorAccountId: v.optional(v.id("users")), // ID dell'utente che ha configurato l'integrazione
  integratorAccountEmail: v.optional(v.string()), // Email dell'account Auth0 configurato
  integratorConfiguredAt: v.optional(v.number()), // Timestamp di configurazione dell'integrazione
};

export const companyMembershipSchema = {
  userId: v.id("users"),
  companyId: v.id("companies"),
  isAdmin: v.boolean(),
  joinedAt: v.number(),
  leftAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  // 📧 INVITO UTENTI
  invitedAt: v.optional(v.number()), // Timestamp quando l'invito è stato inviato
};

// 🏢 STRUTTURA ORGANIZZATIVA
export const departmentSchema = {
  name: v.string(),
  leaderId: v.id("users"),
  companyId: v.id("companies"),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const levelSchema = {
  description: v.string(),
  number: v.number(),
  companyId: v.optional(v.id("companies")),
  maxImpact: v.optional(v.number()),
  minImpact: v.optional(v.number()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const clusterSchema = {
  name: v.string(),
  teamClusterLeaderId: v.optional(v.id("teams")),
  departmentId: v.id("departments"),
  reportingDays: v.number(),
  logoUrl: v.optional(v.string()),
  levelId: v.id("levels"),
  slug: v.string(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const teamSchema = {
  name: v.string(),
  teamLeaderId: v.id("users"),
  // ❌ reportingMonths rimosso - La configurazione è ora centralizzata a livello company
  impact: v.number(),
  clusterId: v.optional(v.id("clusters")),
  type: TeamTypeSchema,
  companyId: v.id("companies"),
  createdAt: v.number(),
  lastTrackingDate: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  slug: v.string(),
  nextDeadline: v.optional(v.number()),
};

export const membershipSchema = {
  userId: v.id("users"),
  teamId: v.id("teams"),
  createdAt: v.number(),
  percentageBonus: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  leftAt: v.optional(v.number()), // Timestamp quando l'utente ha lasciato il team
  // 📧 INVITO UTENTI
  invitedAt: v.optional(v.number()), // Timestamp quando l'invito è stato inviato
};

export const bonusSchema = {
  membershipUserId: v.id("users"),
  membershipTeamId: v.id("teams"),
  reportId: v.id("reports"),
  companyId: v.id("companies"), // 🆕 Per query ottimizzate
  potentialBonus: v.number(),
  isAchieved: v.boolean(),
  multiplier: v.optional(v.number()),
  isException: v.optional(v.boolean()),
  actualBonus: v.number(),
  createdAt: v.number(),

  // 🆕 CAMPI DI TRACCIABILITÀ
  pointValueAmount: v.number(), // Valore monetario per punto (€/punto)
  teamImpactPointsUsed: v.number(), // Punti impatto del team utilizzati
  userValuePoints: v.number(), // Punti valore dell'utente
  budgetSnapshot: v.number(), // Snapshot del budget aziendale
};

// 📊 INDICATORI E PERFORMANCE
export const indicatorSchema = {
  companyId: v.id("companies"),
  description: v.string(),
  symbol: v.string(),
  periodicity: PeriodicitySchema,
  assigneeId: v.optional(v.id("users")),
  createdAt: v.number(),
  automationUrl: v.optional(v.string()),
  automationDescription: v.optional(v.string()),
  deletedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  isReverse: v.optional(v.boolean()),
  slug: v.string(),
  forecastDate: v.optional(v.number()),
  // 🤖 AI Coach Chat System
  suggestionId: v.optional(v.id("agentSuggestions")),
};

export const objectiveSchema = {
  title: v.string(),
  description: v.string(),
  teamId: v.id("teams"),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  slug: v.string(),
  // 🤖 AI Coach Chat System
  suggestionId: v.optional(v.id("agentSuggestions")),
};

export const keyResultSchema = {
  objectiveId: v.optional(v.id("objectives")),
  indicatorId: v.id("indicators"),
  weight: v.number(),
  impact: v.optional(v.number()),
  nextKeyResult: v.optional(v.string()),
  finalForecastValue: v.number(),
  finalTargetValue: v.number(),
  finalForecastTargetDate: v.number(),
  slug: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  // Campi per orfanaggio
  deletedObjectiveSlug: v.optional(v.string()),
  deletedObjectiveTitle: v.optional(v.string()),
  deletedObjectiveId: v.optional(v.string()),
  deletedObjectiveTeamId: v.optional(v.string()),
  // 🤖 AI Coach Chat System
  suggestionId: v.optional(v.id("agentSuggestions")),
};

export const riskSchema = {
  description: v.string(),
  keyResultId: v.optional(v.id("keyResults")),
  isRed: v.optional(v.boolean()),
  priority: PrioritySchema, // 🆕 Campo priority controllato dall'utente
  relativeImpact: v.optional(v.number()), // 🔄 Ora calcolato automaticamente dalla priority
  overallImpact: v.optional(v.number()), // 🔄 Calcolato automaticamente
  slug: v.string(),
  indicatorId: v.optional(v.id("indicators")),
  triggerValue: v.optional(v.number()),
  triggeredIfLower: v.optional(v.boolean()),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
  // Campi per orfanaggio
  deletedKeyResultIndicatorDescription: v.optional(v.string()),
  deletedKeyResultSlug: v.optional(v.string()),
  deletedKeyResultId: v.optional(v.string()),
  deletedKeyResultTeamId: v.optional(v.id("teams")),
  // 🤖 AI Coach Chat System
  suggestionId: v.optional(v.id("agentSuggestions")),
};

export const initiativeSchema = {
  description: v.string(),
  riskId: v.optional(v.id("risks")),
  assigneeId: v.id("users"),
  createdBy: v.id("users"),
  checkInDays: v.number(),
  status: InitiativeStatusSchema,
  isNew: v.boolean(),
  lastCheckInDate: v.optional(v.number()),
  priority: PrioritySchema, // 🆕 Campo priority controllato dall'utente
  relativeImpact: v.number(), // 🔄 Ora calcolato automaticamente dalla priority
  overallImpact: v.number(), // 🔄 Calcolato automaticamente
  finishedAt: v.optional(v.number()),
  externalUrl: v.optional(v.string()),
  teamId: v.id("teams"),
  notes: v.optional(v.string()),
  slug: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
  // Campi per orfanaggio
  deletedRiskDescription: v.optional(v.string()),
  deletedRiskSlug: v.optional(v.string()),
  deletedRiskId: v.optional(v.string()),
  deletedRiskTeamId: v.optional(v.string()),
  // 🤖 AI Coach Chat System
  suggestionId: v.optional(v.id("agentSuggestions")),
};

// 📈 VALORI E FORECAST
export const forecastSchema = {
  value: v.number(),
  date: v.number(),
  indicatorId: v.id("indicators"),
  updatedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

export const valueSchema = {
  value: v.number(),
  date: v.number(),
  indicatorId: v.id("indicators"),
  updatedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

export const milestoneSchema = {
  indicatorId: v.id("indicators"),
  description: v.string(),
  value: v.number(),
  achievedAt: v.optional(v.number()),
  slug: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
  forecastDate: v.optional(v.number()),
};

// 💬 COMMENTI E COMUNICAZIONI
export const commentSchema = {
  text: v.string(),
  senderId: v.id("users"),
  receiverId: v.id("users"),
  companyId: v.id("companies"), // NUOVO: autorizzazione a livello company
  indicatorId: v.optional(v.id("indicators")),
  initiativeId: v.optional(v.id("initiatives")),
  teamId: v.optional(v.id("teams")),
  riskId: v.optional(v.id("risks")),
  personalInitiativeId: v.optional(v.id("personalInitiatives")),
  readAt: v.optional(v.number()),

  // Supporto per le menzioni (array di ID utenti menzionati)
  mentionIds: v.optional(v.array(v.id("users"))),

  // 👍 REAZIONI THUMBS UP - Array di ID utenti che hanno messo "mi piace"
  thumbReactions: v.optional(v.array(v.id("users"))),

  // 📎 ALLEGATI - Supporto per file allegati con scadenza 30 giorni
  attachmentStorageId: v.optional(v.id("_storage")),
  attachmentFilename: v.optional(v.string()),
  attachmentExpiresAt: v.optional(v.number()), // timestamp di scadenza

  // Rimuoviamo createdAt - Convex usa automaticamente _creationTime
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

export const mentionSchema = {
  commentId: v.id("comments"),
  userId: v.id("users"),
  readAt: v.optional(v.number()),
  // Rimuoviamo createdAt - Convex usa automaticamente _creationTime
};

export const notificationSchema = {
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  message: v.string(),
  readAt: v.optional(v.number()),
  entityId: v.optional(v.string()),
  entityType: v.optional(v.string()),
  // Rimosso createdAt - Convex usa automaticamente _creationTime
};

// 📋 REPORT E RISULTATI
export const reportSchema = {
  teamId: v.id("teams"),
  reporterId: v.id("users"),
  startDate: v.number(),
  trackingDate: v.number(),
  nextTargetDate: v.number(),
  reviewerId: v.id("users"),
  reviewedAt: v.optional(v.number()),
  reportedAt: v.optional(v.number()), // 🆕 Momento in cui il team ha generato il report
  impactPoints: v.optional(v.number()),
  reportRate: v.optional(v.number()),
  reviewRate: v.optional(v.number()),
  performanceScoreReported: v.optional(v.number()),
  status: ReportStatusSchema, // 🆕 NUOVO CAMPO per tracciare il ciclo di vita del report
  resultType: v.optional(ResultTypeSchema), // ✅ CORRETTO - Ora usa l'enum per expectations invece di OtoResultType
  reporterNotes: v.optional(v.string()),
  reviewerNotes: v.optional(v.string()),
  slug: v.string(),
  reportExpired: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

export const resultTrackedSchema = {
  reportId: v.id("reports"),
  keyResultId: v.id("keyResults"),
  forecastValue: v.number(),
  targetValue: v.number(),
  intervallSource: IntervalSourceSchema,
  actualResultValue: v.number(),
  performanceScore: v.number(),
  resultType: ResultTypeSchema,
  weightReported: v.number(),
  weightReviewed: v.optional(v.number()),
  impactPoints: v.number(),
  notes: v.optional(v.string()),
  indicatorDescription: v.string(),
  indicatorId: v.id("indicators"),
  indicatorSymbol: v.string(),
  isRetroactive: v.optional(v.boolean()),
  objectiveDescription: v.string(),
  objectiveTitle: v.string(),
  reportExpired: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

export const resultNextSchema = {
  reportId: v.id("reports"),
  keyResultId: v.id("keyResults"),
  forecastValueReported: v.number(),
  targetValueReported: v.number(),
  forecastValueReviewed: v.optional(v.number()),
  targetValueReviewed: v.optional(v.number()),
  notes: v.optional(v.string()),
  indicatorDescription: v.string(),
  indicatorId: v.id("indicators"),
  finalForecastTargetDate: v.number(),
  finalTargetValue: v.number(),
  indicatorSymbol: v.string(),
  actualResultValue: v.number(),
  mainRiskId: v.optional(v.id("risks")),
  objectiveDescription: v.string(),
  objectiveTitle: v.string(),
  reportExpired: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

// 🎯 SISTEMA FEEDBACK 360
export const session360Schema = {
  title: v.string(),
  description: v.optional(v.string()),
  status: Session360StatusSchema,
  startDate: v.number(),
  endDate: v.number(),
  companyId: v.id("companies"),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const questionSchema = {
  text: v.string(),
  category: SkillCategorySchema,
  companyId: v.id("companies"),
  isActive: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const feedbackGenerationSchema = {
  sessionId: v.id("sessions360"),
  ruleId: v.id("rules"),
  companyId: v.id("companies"),
  generatedBy: v.id("users"),
  totalFeedbacks: v.number(),
  categoryDistribution: v.object({
    EXECUTION: v.number(),
    SOFT: v.number(),
    STRATEGY: v.number(),
  }),
  uniqueSenders: v.number(),
  uniqueReceivers: v.number(),
  isConfirmed: v.boolean(),
  confirmedAt: v.optional(v.number()),
  rolledBackAt: v.optional(v.number()),
  createdAt: v.number(),
  // ✨ SISTEMA DICHIARATIVO - Campi semplificati
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed")
  ),
  executionLogs: v.optional(v.string()),
};

export const feedbackSchema = {
  sessionId: v.id("sessions360"),
  questionId: v.optional(v.id("questions")),
  processId: v.optional(v.id("processes")),
  senderId: v.id("users"),
  receiverId: v.id("users"),
  rating: v.optional(v.number()), // Ora solo per valutazioni 1-5
  comment: v.optional(v.string()),
  isSelfAssessment: v.optional(v.boolean()),
  category: SkillCategorySchema,
  feedbackGenerationId: v.optional(v.id("feedbackGenerations")),
  status: FeedbackStatusSchema, // NUOVO CAMPO OBBLIGATORIO
  createdAt: v.number(),
};

export const SessionResultStatusSchema = v.union(
  v.literal("open"),
  v.literal("closed")
);

export const sessionResultSchema = {
  sessionId: v.id("sessions360"),
  userId: v.id("users"),
  overallScore: v.optional(v.number()),
  gap: v.optional(v.number()),
  executionScore: v.optional(v.number()),
  softScore: v.optional(v.number()),
  strategyScore: v.optional(v.number()),
  status: SessionResultStatusSchema,
  generatedAt: v.number(),
};

export const otoReportSchema = {
  sessionResultId: v.optional(v.id("sessionResults")),
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  resultType: OtoResultTypeSchema,
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const personalInitiativeSchema = {
  ownerId: v.id("users"),
  description: v.string(),
  sessionResultId: v.id("sessionResults"),
  status: PersonalInitiativeStatusSchema,
  dueDate: v.optional(v.number()),
  feedbackId: v.optional(v.id("feedbacks")),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// 🤝 COLLABORAZIONI E PROCESSI
export const teamCollaborationSchema = {
  firstTeamId: v.id("teams"),
  secondTeamId: v.id("teams"),
  indicatorId: v.id("indicators"),
  companyId: v.id("companies"), // CAMPO AGGIUNTO per data isolation
  detectedAt: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const tagSchema = {
  text: v.string(),
  questionId: v.id("questions"),
  rating: v.number(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const ruleSchema = {
  name: v.string(),
  description: v.optional(v.string()),

  // ✨ SISTEMA DICHIARATIVO - Sostituisce TypeScript dinamico
  ruleConfig: v.object({
    // --- CHI INVIA IL FEEDBACK ---
    senderCriteria: v.object({
      type: v.union(
        v.literal("allUsers"), // Regola 6 (Autovalutazione)
        v.literal("teamLeaders"), // Regole 2, 7
        v.literal("clusterLeaders"), // Regola 1
        v.literal("teamMembers"), // Regola 3
        v.literal("mentors"), // Regola 5
        v.literal("usersWithProcesses") // Regola 4
      ),
      // Filtri opzionali per restringere il gruppo di mittenti
      fromTeams: v.optional(v.array(v.id("teams"))),
      fromProcesses: v.optional(v.array(v.id("processes"))),
      excludeUsers: v.optional(v.array(v.id("users"))),
    }),
    // --- CHI RICEVE IL FEEDBACK ---
    receiverCriteria: v.object({
      type: v.union(
        // Tipi relativi al mittente
        v.literal("theirClusterLeader"), // Regola 2: Il CL del mittente (TL)
        v.literal("theirTeamLeaders"), // Regola 1: I TL nel cluster del mittente (CL)
        v.literal("theirTeamMembers"), // Regola 3: I membri del team del mittente
        v.literal("theirMentees"), // Regola 5: I mentee del mittente (Mentor)
        v.literal("peersInProcess"), // Regola 4: Altri utenti nello stesso processo
        v.literal("collaboratingTeamLeaders"), // Regola 7: TL di team collaborativi
        // Tipi assoluti
        v.literal("self"), // Regola 6: Autovalutazione
        v.literal("specificUsers") // Per regole custom
      ),
      // Filtri opzionali
      specificUsers: v.optional(v.array(v.id("users"))),
      excludeSelf: v.optional(v.boolean()), // Es. per Regole 3, 4, 7
    }),
    // --- CONFIGURAZIONE DEL FEEDBACK ---
    feedbackConfig: v.object({
      categories: v.array(
        v.union(
          v.literal("EXECUTION"),
          v.literal("SOFT"),
          v.literal("STRATEGY")
        )
      ),
      // Opzioni per customizzazione fine
      questionIds: v.optional(v.array(v.id("questions"))),
      processIds: v.optional(v.array(v.id("processes"))),
      useAllQuestionsInCategory: v.optional(v.boolean()),
    }),
  }),

  companyId: v.id("companies"),

  // ✨ CAMPI PER METADATI
  isActive: v.optional(v.boolean()),

  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
};

// ❌ ruleTemplatesSchema rimossa - Non più necessaria per sistema dichiarativo

export const processSchema = {
  name: v.string(),
  description: v.optional(v.string()),
  companyId: v.id("companies"),
  isActive: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
};

export const userProcessSchema = {
  userId: v.id("users"),
  processId: v.id("processes"),
  createdAt: v.number(),
};

export const favoriteTeamSchema = {
  userId: v.id("users"),
  teamId: v.id("teams"),
  companyId: v.id("companies"), // Per filtrare per company
  createdAt: v.number(),
};

// 🔐 AUTH TABLES (Ottimizzate per JWT Bridge)
const authTables = {
  users: defineTable(userSchema)
    .index("by_email", ["email"])
    .index("by_mentor", ["mentorId"])
    .index("by_primary_company", ["primaryCompanyId"])
    .index("by_deleted_at", ["deletedAt"])
    .index("by_role", ["roleId"])
    .index("by_email_verified", ["email", "emailVerified"])
    .index("by_email_active", ["email", "deletedAt"])
    .index("by_role_active", ["roleId", "deletedAt"])
    .index("by_global_admin", ["isGlobalAdmin"])
    .index("by_reset_token", ["resetPasswordToken"]),

  // ❌ sessions table rimossa - Non più necessaria con JWT bridge
  // ❌ verificationTokens table rimossa - Non più necessaria con JWT bridge

  accounts: defineTable(accountSchema)
    .index("by_provider_account", ["provider", "providerAccountId"])
    .index("by_user_id", ["userId"]),

  authenticators: defineTable(authenticatorSchema)
    .index("by_user_id", ["userId"])
    .index("by_credential_id", ["credentialID"]),
};

// 🏢 BUSINESS TABLES COMPLETE
const businessTables = {
  // 🎭 RUOLI E COMPANIES
  roles: defineTable(roleSchema)
    .index("by_company", ["companyId"])
    .index("by_created_at", ["createdAt"]),

  companies: defineTable(companySchema)
    .index("by_slug", ["slug"])
    .index("by_name", ["name"])
    .index("by_created_at", ["createdAt"])
    .index("by_north_star", ["northStarKeyResultId"])
    .index("by_integrator_email", ["integratorAccountEmail"]),

  companyMemberships: defineTable(companyMembershipSchema)
    .index("by_user_id", ["userId"])
    .index("by_company_id", ["companyId"])
    .index("by_user_company", ["userId", "companyId"])
    .index("by_joined_at", ["joinedAt"])
    .index("by_admin_memberships", ["companyId", "isAdmin"])
    .index("by_active_memberships", ["userId", "leftAt", "deletedAt"])
    .index("by_company_active", ["companyId", "leftAt", "deletedAt"]),

  // 🏢 STRUTTURA ORGANIZZATIVA
  departments: defineTable(departmentSchema)
    .index("by_company", ["companyId"])
    .index("by_leader", ["leaderId"])
    .index("by_company_leader", ["companyId", "leaderId"])
    .index("by_active_company", ["companyId", "deletedAt"]),

  levels: defineTable(levelSchema)
    .index("by_company", ["companyId"])
    .index("by_number", ["number"])
    .index("by_created_at", ["createdAt"]),

  clusters: defineTable(clusterSchema)
    .index("by_team_leader", ["teamClusterLeaderId"])
    .index("by_department", ["departmentId"])
    .index("by_level", ["levelId"])
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"]),

  teams: defineTable(teamSchema)
    .index("by_company", ["companyId"])
    .index("by_leader", ["teamLeaderId"])
    .index("by_cluster", ["clusterId"])
    .index("by_slug", ["slug"])
    .index("by_company_active", ["companyId", "deletedAt"])
    .index("by_leader_company", ["teamLeaderId", "companyId"])
    .index("by_cluster_leader", ["clusterId", "teamLeaderId"])
    .index("by_slug_active", ["slug", "deletedAt"])
    .index("by_created_at", ["createdAt"]),

  memberships: defineTable(membershipSchema)
    .index("by_user_id", ["userId"])
    .index("by_team_id", ["teamId"])
    .index("by_user_team", ["userId", "teamId"])
    .index("by_team_created", ["teamId", "createdAt"])
    .index("by_user_team_deleted", ["userId", "teamId", "deletedAt"]),

  bonuses: defineTable(bonusSchema)
    .index("by_membership", ["membershipUserId", "membershipTeamId"])
    .index("by_report", ["reportId"])
    .index("by_created_at", ["createdAt"])
    // 🆕 NUOVI INDICI
    .index("by_company_period", ["companyId", "createdAt"])
    .index("by_achieved_period", ["isAchieved", "createdAt"])
    .index("by_multiplier", ["multiplier"])
    .index("by_user_company", ["membershipUserId", "companyId"]),

  // 📊 INDICATORI E PERFORMANCE
  indicators: defineTable(indicatorSchema)
    .index("by_company", ["companyId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"])
    .index("by_company_active", ["companyId", "deletedAt"]),

  objectives: defineTable(objectiveSchema)
    .index("by_team", ["teamId"])
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"])
    .index("by_team_active", ["teamId", "deletedAt"])
    .index("by_updated_at", ["updatedAt"]),

  keyResults: defineTable(keyResultSchema)
    .index("by_objective", ["objectiveId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_objective_active", ["objectiveId", "deletedAt"])
    .index("by_orphaned_team", ["deletedObjectiveTeamId", "deletedAt"]),

  risks: defineTable(riskSchema)
    .index("by_key_result", ["keyResultId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"])
    .index("by_key_result_active", ["keyResultId", "deletedAt"])
    .index("by_indicator_active", ["indicatorId", "deletedAt"])
    .index("by_orphaned_team", ["deletedKeyResultTeamId", "deletedAt"]),

  initiatives: defineTable(initiativeSchema)
    .index("by_risk", ["riskId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_creator", ["createdBy"])
    .index("by_team", ["teamId"])
    .index("by_slug", ["slug"])
    .index("by_assignee_impact", ["assigneeId", "overallImpact"])
    .index("by_creator_impact", ["createdBy", "overallImpact"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_assignee_status_active", ["assigneeId", "status", "deletedAt"])
    .index("by_creator_status_active", ["createdBy", "status", "deletedAt"])
    .index("by_team_risk_orphaned", ["teamId", "riskId", "deletedAt"])
    .index("by_orphaned_team", ["deletedRiskTeamId", "deletedAt"]),

  // 📈 VALORI E FORECAST
  forecasts: defineTable(forecastSchema)
    .index("by_indicator", ["indicatorId"])
    .index("by_indicator_active", ["indicatorId", "deletedAt"])
    .index("by_indicator_date", ["indicatorId", "date"])
    .index("by_created_at", ["createdAt"])
    .index("by_date", ["date"])
    .index("by_updater", ["updatedBy"])
    .index("by_active", ["deletedAt"]),

  values: defineTable(valueSchema)
    .index("by_indicator", ["indicatorId"])
    .index("by_indicator_active", ["indicatorId", "deletedAt"]) // NUOVO: recupero veloce ultimo valore attivo
    .index("by_indicator_date", ["indicatorId", "date"])
    .index("by_created_at", ["createdAt"])
    .index("by_date", ["date"])
    .index("by_updater", ["updatedBy"])
    .index("by_active", ["deletedAt"]),

  milestones: defineTable(milestoneSchema)
    .index("by_indicator", ["indicatorId"]) // già presente
    .index("by_indicator_active", ["indicatorId", "deletedAt"]) // NUOVO per query solo attive
    .index("by_indicator_achieved", ["indicatorId", "achievedAt"]) // opzionale per ordinamenti
    .index("by_slug", ["slug"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"]),

  // 💬 COMMENTI E COMUNICAZIONI
  comments: defineTable(commentSchema)
    .index("by_company", ["companyId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_initiative", ["initiativeId"])
    .index("by_team", ["teamId"])
    .index("by_risk", ["riskId"])
    .index("by_personal_initiative", ["personalInitiativeId"])
    .index("by_receiver_read", ["receiverId", "readAt"])
    .index("by_receiver_active", ["receiverId", "deletedAt"])
    .index("by_initiative_active", ["initiativeId", "deletedAt"])
    .index("by_indicator_active", ["indicatorId", "deletedAt"])
    .index("by_team_active", ["teamId", "deletedAt"])
    .index("by_risk_active", ["riskId", "deletedAt"])
    .index("by_personal_initiative_active", [
      "personalInitiativeId",
      "deletedAt",
    ])
    // NUOVI indici per autorizzazione company-level e query ottimizzate
    .index("by_entity", [
      "companyId",
      "indicatorId",
      "initiativeId",
      "teamId",
      "riskId",
      "personalInitiativeId",
    ])
    .index("by_company_receiver", ["companyId", "receiverId"])
    .index("by_company_sender", ["companyId", "senderId"])
    .index("by_company_active", ["companyId", "deletedAt"]),

  mentions: defineTable(mentionSchema)
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "readAt"]),

  notifications: defineTable(notificationSchema)
    .index("by_user", ["userId"])
    .index("by_user_readAt", ["userId", "readAt"])
    .index("by_entity", ["entityId"])
    .index("by_type", ["type"])
    .index("by_entity_type", ["entityType"])
    // 🆕 NUOVO INDICE per ottimizzare le query di notifiche non lette per tipo
    .index("by_user_type_unread", ["userId", "type", "readAt"]),

  // 📋 REPORT E RISULTATI
  reports: defineTable(reportSchema)
    .index("by_team", ["teamId"])
    .index("by_reporter", ["reporterId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_slug", ["slug"])
    .index("by_reporter_created", ["reporterId", "createdAt"])
    .index("by_reviewer_reviewed", ["reviewerId", "reviewedAt"])
    .index("by_team_created", ["teamId", "createdAt"])
    .index("by_tracking_date", ["trackingDate"])
    .index("by_active", ["deletedAt"])
    // 🆕 NUOVI INDICI per ottimizzare le query di reporting
    .index("by_status", ["status"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_result_type_team", ["teamId", "resultType"])
    .index("by_period_team", ["teamId", "trackingDate"])
    .index("by_expiration", ["nextTargetDate", "status"])
    .index("by_team_next_target_date", ["teamId", "nextTargetDate"]),

  resultTracked: defineTable(resultTrackedSchema)
    .index("by_report", ["reportId"])
    .index("by_key_result", ["keyResultId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_key_result_created", ["keyResultId", "createdAt"])
    .index("by_performance_score", ["keyResultId", "performanceScore"])
    .index("by_created_at", ["createdAt"]),

  resultNext: defineTable(resultNextSchema)
    .index("by_report", ["reportId"])
    .index("by_key_result", ["keyResultId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_main_risk", ["mainRiskId"])
    .index("by_created_at", ["createdAt"]),

  // 🎯 SISTEMA FEEDBACK 360
  sessions360: defineTable(session360Schema)
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_start_date", ["startDate"])
    .index("by_end_date", ["endDate"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"]),

  questions: defineTable(questionSchema)
    .index("by_company", ["companyId"])
    .index("by_category", ["category"])
    .index("by_company_active", ["companyId", "isActive"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"]),

  feedbackGenerations: defineTable(feedbackGenerationSchema)
    .index("by_session", ["sessionId"])
    .index("by_rule", ["ruleId"])
    .index("by_company", ["companyId"])
    .index("by_generated_by", ["generatedBy"])
    .index("by_confirmed", ["isConfirmed"])
    .index("by_session_confirmed", ["sessionId", "isConfirmed"])
    .index("by_company_session", ["companyId", "sessionId"])
    .index("by_created_at", ["createdAt"])
    .index("by_company_status", ["companyId", "status"]),

  feedbacks: defineTable(feedbackSchema)
    .index("by_session", ["sessionId"])
    .index("by_question", ["questionId"])
    .index("by_process", ["processId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_session_receiver", ["sessionId", "receiverId"])
    .index("by_category", ["category"])
    .index("by_feedback_generation", ["feedbackGenerationId"])
    .index("by_generation_confirmed", ["feedbackGenerationId", "createdAt"])
    .index("by_created_at", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_session_status", ["sessionId", "status"])
    .index("by_session_receiver_status", ["sessionId", "receiverId", "status"]),

  sessionResults: defineTable(sessionResultSchema)
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_session_user", ["sessionId", "userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_generated_at", ["generatedAt"]),

  otoReports: defineTable(otoReportSchema)
    .index("by_session_result", ["sessionResultId"])
    .index("by_mentor", ["mentorId"])
    .index("by_mentee", ["menteeId"])
    .index("by_mentor_mentee", ["mentorId", "menteeId"])
    .index("by_result_type", ["resultType"])
    .index("by_created_at", ["createdAt"]),

  personalInitiatives: defineTable(personalInitiativeSchema)
    .index("by_owner", ["ownerId"])
    .index("by_session_result", ["sessionResultId"])
    .index("by_feedback", ["feedbackId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_session_status", ["sessionResultId", "status"])
    .index("by_feedback_owner", ["feedbackId", "ownerId"])
    .index("by_due_date", ["dueDate"])
    .index("by_created_at", ["createdAt"]),

  // 🤝 COLLABORAZIONI E PROCESSI
  teamCollaborations: defineTable(teamCollaborationSchema)
    .index("by_company_and_active", ["companyId", "isActive"]) // INDICE AGGIUNTO per data isolation
    .index("by_first_team", ["firstTeamId"])
    .index("by_second_team", ["secondTeamId"])
    .index("by_indicator", ["indicatorId"])
    .index("by_active_deleted", ["isActive", "deletedAt"])
    .index("by_detected_at", ["detectedAt"])
    .index("by_created_at", ["createdAt"])
    .index("by_company_team_filter", [
      "companyId",
      "firstTeamId",
      "secondTeamId",
    ]) // Per filtri per team
    .index("by_company_indicator", ["companyId", "indicatorId"]), // Per filtri per indicatore

  tags: defineTable(tagSchema)
    .index("by_question", ["questionId"])
    .index("by_rating", ["rating"])
    .index("by_question_rating", ["questionId", "rating"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"]),

  rules: defineTable(ruleSchema)
    .index("by_company", ["companyId"])
    .index("by_name", ["name"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_active", ["deletedAt"])
    .index("by_company_active", ["companyId", "isActive"]),

  processes: defineTable(processSchema)
    .index("by_company", ["companyId"])
    .index("by_company_active", ["companyId", "isActive"])
    .index("by_name", ["name"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["deletedAt"]),

  userProcesses: defineTable(userProcessSchema)
    .index("by_user", ["userId"])
    .index("by_process", ["processId"])
    .index("by_user_process", ["userId", "processId"])
    .index("by_created_at", ["createdAt"]),

  favoriteTeams: defineTable(favoriteTeamSchema)
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_user_team", ["userId", "teamId"])
    .index("by_user_company", ["userId", "companyId"])
    .index("by_company", ["companyId"])
    .index("by_created_at", ["createdAt"]),
};

// 🤖 AI COACH CHAT SYSTEM SCHEMAS

export const conversationSchema = {
  createdAt: v.number(),
  updatedAt: v.number(),
  teamId: v.id("teams"), // Ora obbligatorio per fornire contesto adeguato
  companyId: v.optional(v.id("companies")),
  status: v.union(v.literal("active"), v.literal("archived")),
  agentThreadId: v.string(),
};

// ELIMINATO: chatMessageSchema - Usiamo agent.listMessages() invece

export const agentSuggestionSchema = {
  conversationId: v.id("conversations"),
  type: v.union(
    v.literal("objective"),
    v.literal("keyResult"),
    v.literal("risk"),
    v.literal("initiative")
  ),
  description: v.string(),
  createdAt: v.number(),
  acceptedAt: v.optional(v.number()),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  agentExecutionId: v.optional(v.string()),
};

export const agentExecutionLogSchema = {
  executionId: v.string(),
  conversationId: v.id("conversations"),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed")
  ),
  steps: v.array(v.any()),
  error: v.optional(v.string()),
  totalCost: v.optional(v.number()),
};

export const agentUsageMetricSchema = {
  conversationId: v.id("conversations"),
  executionId: v.string(),
  model: v.string(),
  promptTokens: v.number(),
  completionTokens: v.number(),
  totalTokens: v.number(),
  cost: v.number(),
  timestamp: v.number(),
};

// ELIMINATO: conversationThreadMappingSchema - Usiamo conversation.agentThreadId invece

// 🤖 AI COACH CHAT SYSTEM TABLES
const aiCoachTables = {
  conversations: defineTable(conversationSchema)
    .index("by_team", ["teamId"])
    .index("by_company", ["companyId"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_status", ["status"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_agent_thread", ["agentThreadId"]),

  agentSuggestions: defineTable(agentSuggestionSchema)
    .index("by_conversation", ["conversationId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_conversation_status", ["conversationId", "status"])
    .index("by_conversation_type", ["conversationId", "type"])
    .index("by_created_at", ["createdAt"])
    .index("by_agent_execution", ["agentExecutionId"]),

  agentExecutionLogs: defineTable(agentExecutionLogSchema)
    .index("by_execution_id", ["executionId"])
    .index("by_conversation", ["conversationId"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_conversation_status", ["conversationId", "status"]),

  agentUsageMetrics: defineTable(agentUsageMetricSchema)
    .index("by_conversation", ["conversationId"])
    .index("by_execution", ["executionId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_model", ["model"])
    .index("by_conversation_timestamp", ["conversationId", "timestamp"])
    .index("by_model_timestamp", ["model", "timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...businessTables,
  ...aiCoachTables,
});
