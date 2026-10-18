import { int, index, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "supplier", "authority", "regulator"]).default("user").notNull(),
  themePreference: mysqlEnum("themePreference", ["light", "dark", "system"]).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  organizationName: varchar("organizationName", { length: 255 }),
  registrationNumber: varchar("registrationNumber", { length: 120 }),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  completion: int("completion").default(40).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operatorProfiles = mysqlTable("operatorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  operatorType: varchar("operatorType", { length: 80 }).notNull(),
  legalForm: varchar("legalForm", { length: 80 }),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  wilayaCode: varchar("wilayaCode", { length: 2 }),
  taxCenterType: varchar("taxCenterType", { length: 8 }),
  activityCodes: text("activityCodes"),
  representativeName: varchar("representativeName", { length: 255 }),
  representativeQuality: varchar("representativeQuality", { length: 80 }),
  nif: varchar("nif", { length: 15 }),
  nis: varchar("nis", { length: 15 }),
  rc: varchar("rc", { length: 32 }),
  taxArticle: varchar("taxArticle", { length: 11 }),
  nin: varchar("nin", { length: 18 }),
  rib: varchar("rib", { length: 20 }),
  status: mysqlEnum("status", ["draft", "submitted"]).default("draft").notNull(),
  declarationVersion: varchar("declarationVersion", { length: 32 }),
  declaredAt: timestamp("declaredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const operatorDocuments = mysqlTable("operatorDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: varchar("documentType", { length: 80 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("operator_documents_user_created_idx").on(table.userId, table.createdAt),
}));

export const operatorDeclarations = mysqlTable("operatorDeclarations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  declarationType: varchar("declarationType", { length: 80 }).notNull(),
  textVersion: varchar("textVersion", { length: 32 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});

export const tenders = mysqlTable("tenders", {
  id: int("id").autoincrement().primaryKey(),
  authorityId: int("authorityId").notNull(),
  reference: varchar("reference", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  budget: int("budget"),
  currency: varchar("currency", { length: 10 }).default("DZD").notNull(),
  location: varchar("location", { length: 160 }),
  deadline: timestamp("deadline").notNull(),
  status: mysqlEnum("status", ["draft", "published", "closed", "evaluation", "awarded", "cancelled"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
  closedAt: timestamp("closedAt"),
}, (table) => ({
  statusDeadlineIdx: index("tenders_status_deadline_idx").on(table.status, table.deadline),
  authorityStatusIdx: index("tenders_authority_status_idx").on(table.authorityId, table.status),
}));

export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull(),
  supplierId: int("supplierId").notNull(),
  amount: int("amount").notNull(),
  proposal: text("proposal").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "accepted", "rejected"]).default("draft").notNull(),
  evaluationNote: text("evaluationNote"),
  submittedAt: timestamp("submittedAt"),
  openedAt: timestamp("openedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  evaluatedAt: timestamp("evaluatedAt"),
}, (table) => ({
  tenderSupplierUnique: uniqueIndex("bids_tender_supplier_unique").on(table.tenderId, table.supplierId),
  tenderStatusIdx: index("bids_tender_status_idx").on(table.tenderId, table.status),
}));

export const tenderDocuments = mysqlTable("tenderDocuments", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bidDocuments = mysqlTable("bidDocuments", {
  id: int("id").autoincrement().primaryKey(),
  bidId: int("bidId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  bidCreatedIdx: index("bid_documents_bid_created_idx").on(table.bidId, table.createdAt),
}));
export const bidOpeningSessions = mysqlTable("bidOpeningSessions", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull().unique(),
  status: mysqlEnum("status", ["scheduled", "opened", "sealed"]).default("scheduled").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  openedAt: timestamp("openedAt"),
  openedBy: int("openedBy"),
  submittedCount: int("submittedCount").default(0).notNull(),
  minutes: text("minutes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bidOpeningCommitteeMembers = mysqlTable("bidOpeningCommitteeMembers", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["chair", "member", "secretary"]).default("member").notNull(),
  appointedBy: int("appointedBy").notNull(),
  appointedAt: timestamp("appointedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => ({
  tenderUserUnique: uniqueIndex("bid_opening_committee_tender_user_unique").on(table.tenderId, table.userId),
  tenderActiveIdx: index("bid_opening_committee_tender_active_idx").on(table.tenderId, table.revokedAt),
}));

export const bidOpeningMinutes = mysqlTable("bidOpeningMinutes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().unique(),
  tenderId: int("tenderId").notNull().unique(),
  generatedBy: int("generatedBy").notNull(),
  content: text("content").notNull(),
  contentDigest: varchar("contentDigest", { length: 128 }).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  sealedAt: timestamp("sealedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenderSealedIdx: index("bid_opening_minutes_tender_sealed_idx").on(table.tenderId, table.sealedAt),
}));

export const bidOpeningMinutesSignatures = mysqlTable("bidOpeningMinutesSignatures", {
  id: int("id").autoincrement().primaryKey(),
  minutesId: int("minutesId").notNull(),
  tenderId: int("tenderId").notNull(),
  userId: int("userId").notNull(),
  memberRole: mysqlEnum("memberRole", ["chair", "member", "secretary"]).notNull(),
  signatureAlgorithm: varchar("signatureAlgorithm", { length: 40 }).default("SHA256-IDENTITY-BOUND").notNull(),
  signatureDigest: varchar("signatureDigest", { length: 128 }).notNull(),
  signedAt: timestamp("signedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  minutesUserUnique: uniqueIndex("bid_opening_minutes_signatures_minutes_user_unique").on(table.minutesId, table.userId),
  tenderSignedIdx: index("bid_opening_minutes_signatures_tender_signed_idx").on(table.tenderId, table.signedAt),
}));

export const awardDecisions = mysqlTable("awardDecisions", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull().unique(),
  winningBidId: int("winningBidId"),
  decidedBy: int("decidedBy").notNull(),
  decision: mysqlEnum("decision", ["awarded", "cancelled"]).notNull(),
  notes: text("notes"),
  decidedAt: timestamp("decidedAt").defaultNow().notNull(),
});

export const supplierContracts = mysqlTable("supplierContracts", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull().unique(),
  winningBidId: int("winningBidId").notNull().unique(),
  supplierId: int("supplierId").notNull(),
  contractReference: varchar("contractReference", { length: 120 }).notNull().unique(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("DZD").notNull(),
  status: mysqlEnum("status", ["pending_signature", "active", "completed", "suspended", "terminated"]).default("pending_signature").notNull(),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierStatusIdx: index("supplier_contracts_supplier_status_idx").on(table.supplierId, table.status),
  supplierAwardedIdx: index("supplier_contracts_supplier_awarded_idx").on(table.supplierId, table.awardedAt),
}));

export const supplierOperationalAlerts = mysqlTable("supplierOperationalAlerts", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  contractId: int("contractId"),
  tenderId: int("tenderId"),
  eventKey: varchar("eventKey", { length: 180 }).notNull().unique(),
  type: mysqlEnum("type", ["contract_awarded", "contract_status", "tender_deadline", "tender_match"]).notNull(),
  severity: mysqlEnum("severity", ["success", "info", "warning"]).default("info").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierCreatedIdx: index("supplier_operational_alerts_supplier_created_idx").on(table.supplierId, table.createdAt),
  supplierReadIdx: index("supplier_operational_alerts_supplier_read_idx").on(table.supplierId, table.readAt),
}));

export const authorityOperationalAlerts = mysqlTable("authorityOperationalAlerts", {
  id: int("id").autoincrement().primaryKey(),
  authorityId: int("authorityId").notNull(),
  tenderId: int("tenderId"),
  eventKey: varchar("eventKey", { length: 180 }).notNull().unique(),
  type: mysqlEnum("type", ["authority_approved", "tender_published", "tender_closed", "evaluation_started", "contract_status"]).notNull(),
  severity: mysqlEnum("severity", ["success", "info", "warning"]).default("info").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorityCreatedIdx: index("authority_operational_alerts_authority_created_idx").on(table.authorityId, table.createdAt),
  authorityReadIdx: index("authority_operational_alerts_authority_read_idx").on(table.authorityId, table.readAt),
}));

export const adminDelegations = mysqlTable("adminDelegations", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  authorityUserId: int("authorityUserId").notNull(),
  scope: mysqlEnum("scope", ["manage", "decide"]).notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const smartTenderDocuments = mysqlTable("smartTenderDocuments", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  authorityId: int("authorityId"),
  tenderId: int("tenderId"),
  audience: mysqlEnum("audience", ["supplier", "authority"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "in_review", "approved", "archived"]).default("draft").notNull(),
  completion: int("completion").default(0).notNull(),
  currentVersionNumber: int("currentVersionNumber").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerStatusIdx: index("smart_tender_documents_owner_status_idx").on(table.ownerId, table.status),
  authorityStatusIdx: index("smart_tender_documents_authority_status_idx").on(table.authorityId, table.status),
  tenderIdx: index("smart_tender_documents_tender_idx").on(table.tenderId),
}));

export const smartTenderDocumentVersions = mysqlTable("smartTenderDocumentVersions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  contentJson: text("contentJson").notNull(),
  contentDigest: varchar("contentDigest", { length: 128 }).notNull(),
  createdBy: int("createdBy").notNull(),
  source: mysqlEnum("source", ["human", "ai_assisted"]).default("human").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentVersionUnique: uniqueIndex("smart_tender_document_versions_unique").on(table.documentId, table.versionNumber),
  documentCreatedIdx: index("smart_tender_document_versions_created_idx").on(table.documentId, table.createdAt),
}));

export const smartTenderDocumentReviews = mysqlTable("smartTenderDocumentReviews", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  versionId: int("versionId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  decision: mysqlEnum("decision", ["pending", "approved", "changes_requested", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentReviewIdx: index("smart_tender_document_reviews_document_idx").on(table.documentId, table.createdAt),
  reviewerIdx: index("smart_tender_document_reviews_reviewer_idx").on(table.reviewerId, table.createdAt),
}));

export const aiAuditLogs = mysqlTable("aiAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  actorRole: varchar("actorRole", { length: 40 }).notNull(),
  featureCode: varchar("featureCode", { length: 100 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  policyDecision: varchar("policyDecision", { length: 40 }).notNull(),
  result: varchar("result", { length: 40 }).notNull(),
  modelUsed: int("modelUsed").default(0).notNull(),
  inputDigest: varchar("inputDigest", { length: 128 }),
  outputDigest: varchar("outputDigest", { length: 128 }),
  requestId: varchar("requestId", { length: 80 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  actorCreatedIdx: index("ai_audit_logs_actor_created_idx").on(table.actorId, table.createdAt),
  featureCreatedIdx: index("ai_audit_logs_feature_created_idx").on(table.featureCode, table.createdAt),
  entityCreatedIdx: index("ai_audit_logs_entity_created_idx").on(table.entityType, table.entityId, table.createdAt),
}));

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  actorRole: varchar("actorRole", { length: 40 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  result: varchar("result", { length: 40 }).notNull(),
  metadata: text("metadata"),
  previousHash: varchar("previousHash", { length: 128 }),
  entryHash: varchar("entryHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const legacyAssistantMessages = mysqlTable("assistantMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  context: varchar("context", { length: 120 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tender = typeof tenders.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type BidOpeningSession = typeof bidOpeningSessions.$inferSelect;
export type BidOpeningMinutesSignature = typeof bidOpeningMinutesSignatures.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SmartTenderDocument = typeof smartTenderDocuments.$inferSelect;
export type SmartTenderDocumentVersion = typeof smartTenderDocumentVersions.$inferSelect;
export type SmartTenderDocumentReview = typeof smartTenderDocumentReviews.$inferSelect;
export type AiAuditLog = typeof aiAuditLogs.$inferSelect;
export type AdminDelegation = typeof adminDelegations.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type OperatorProfile = typeof operatorProfiles.$inferSelect;
export type OperatorDocument = typeof operatorDocuments.$inferSelect;
export type OperatorDeclaration = typeof operatorDeclarations.$inferSelect;


/** Subscription domain: premium productivity only; never gates legally guaranteed procurement access. */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 160 }).notNull(),
  audience: mysqlEnum("audience", ["supplier", "authority"]).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["free", "monthly", "yearly"]).notNull(),
  priceDzd: int("priceDzd").default(0).notNull(),
  annualSavingsPercent: int("annualSavingsPercent").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  isArchived: int("isArchived").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const planFeatures = mysqlTable("planFeatures", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  featureCode: varchar("featureCode", { length: 100 }).notNull(),
  entitlementType: mysqlEnum("entitlementType", ["boolean", "quota", "seats", "configuration"]).notNull(),
  enabled: int("enabled").default(0).notNull(),
  quotaLimit: int("quotaLimit"),
  seatLimit: int("seatLimit"),
  configurationJson: text("configurationJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  planFeatureUnique: uniqueIndex("plan_features_plan_code_unique").on(table.planId, table.featureCode),
  featureCodeIdx: index("plan_features_code_idx").on(table.featureCode),
}));

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  accountUserId: int("accountUserId").notNull().unique(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["pending", "trialing", "active", "past_due", "grace", "cancelled", "expired"]).default("pending").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(),
  cancelledAt: timestamp("cancelledAt"),
  graceEndsAt: timestamp("graceEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusPeriodIdx: index("subscriptions_status_period_idx").on(table.status, table.currentPeriodEnd),
}));

export const subscriptionEntitlementSnapshots = mysqlTable("subscriptionEntitlementSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  featureCode: varchar("featureCode", { length: 100 }).notNull(),
  entitlementType: mysqlEnum("entitlementType", ["boolean", "quota", "seats", "configuration"]).notNull(),
  enabled: int("enabled").default(0).notNull(),
  quotaLimit: int("quotaLimit"),
  seatLimit: int("seatLimit"),
  configurationJson: text("configurationJson"),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
}, (table) => ({
  subscriptionFeatureUnique: uniqueIndex("subscription_entitlement_feature_unique").on(table.subscriptionId, table.featureCode),
}));

export const subscriptionInvoices = mysqlTable("subscriptionInvoices", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 80 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "issued", "paid", "void", "uncollectible"]).default("draft").notNull(),
  amountDzd: int("amountDzd").notNull(),
  currency: varchar("currency", { length: 10 }).default("DZD").notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  pdfStorageKey: varchar("pdfStorageKey", { length: 512 }),
  issuedAt: timestamp("issuedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentTransactions = mysqlTable("paymentTransactions", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  provider: varchar("provider", { length: 60 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 140 }).notNull().unique(),
  providerReference: varchar("providerReference", { length: 180 }),
  status: mysqlEnum("status", ["initiated", "pending", "succeeded", "failed", "reversed"]).default("initiated").notNull(),
  amountDzd: int("amountDzd").notNull(),
  rawReferenceHash: varchar("rawReferenceHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  providerReferenceIdx: index("payment_provider_reference_idx").on(table.provider, table.providerReference),
}));

export const featureUsageLedger = mysqlTable("featureUsageLedger", {
  id: int("id").autoincrement().primaryKey(),
  accountUserId: int("accountUserId").notNull(),
  featureCode: varchar("featureCode", { length: 100 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  units: int("units").default(0).notNull(),
  lastEventAt: timestamp("lastEventAt").defaultNow().notNull(),
}, (table) => ({
  usageWindowUnique: uniqueIndex("usage_account_feature_window_unique").on(table.accountUserId, table.featureCode, table.periodStart),
}));

export const billingEventLogs = mysqlTable("billingEventLogs", {
  id: int("id").autoincrement().primaryKey(),
  eventKey: varchar("eventKey", { length: 180 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  accountUserId: int("accountUserId"),
  subscriptionId: int("subscriptionId"),
  result: varchar("result", { length: 40 }).notNull(),
  payloadHash: varchar("payloadHash", { length: 128 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventTypeCreatedIdx: index("billing_event_type_created_idx").on(table.eventType, table.createdAt),
}));

export const upgradeRequestNotifications = mysqlTable("upgradeRequestNotifications", {
  id: int("id").autoincrement().primaryKey(),
  accountUserId: int("accountUserId").notNull(),
  eventKey: varchar("eventKey", { length: 180 }).notNull().unique(),
  planCode: varchar("planCode", { length: 80 }).notNull(),
  audience: mysqlEnum("audience", ["supplier", "authority"]).notNull(),
  status: mysqlEnum("status", ["pending_contact", "approved", "rejected", "needs_info"]).default("pending_contact").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountCreatedIdx: index("upgrade_notifications_account_created_idx").on(table.accountUserId, table.createdAt),
  accountReadIdx: index("upgrade_notifications_account_read_idx").on(table.accountUserId, table.readAt),
}));

export type Plan = typeof plans.$inferSelect;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionEntitlementSnapshot = typeof subscriptionEntitlementSnapshots.$inferSelect;
export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type FeatureUsage = typeof featureUsageLedger.$inferSelect;
export type BillingEventLog = typeof billingEventLogs.$inferSelect;
export type UpgradeRequestNotification = typeof upgradeRequestNotifications.$inferSelect;
export type SupplierContract = typeof supplierContracts.$inferSelect;
export type SupplierOperationalAlert = typeof supplierOperationalAlerts.$inferSelect;

export const assistantProfiles = mysqlTable("assistantProfiles", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  scopeType: mysqlEnum("scopeType", ["global", "operator", "authority", "central_admin", "contextual"]).notNull(),
  isActive: int("isActive").default(1).notNull(),
  defaultModel: varchar("defaultModel", { length: 120 }),
  systemPromptKey: varchar("systemPromptKey", { length: 120 }).notNull(),
  allowActions: text("allowActions").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assistantThreads = mysqlTable("assistantThreads", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  userId: int("userId").notNull(),
  tenantId: varchar("tenantId", { length: 120 }),
  organizationId: int("organizationId"),
  roleCode: varchar("roleCode", { length: 40 }).notNull(),
  contextType: mysqlEnum("contextType", ["tender", "specification", "bid", "evaluation", "help_center"]).notNull(),
  contextObjectId: int("contextObjectId"),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["open", "closed", "archived"]).default("open").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userStatusIdx: index("assistant_threads_user_status_idx").on(table.userId, table.status), contextIdx: index("assistant_threads_context_idx").on(table.contextType, table.contextObjectId) }));

export const assistantMessages = mysqlTable("assistantMessageRecords", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  normalizedContent: text("normalizedContent"),
  citationsJson: text("citationsJson"),
  tokenUsageInput: int("tokenUsageInput"),
  tokenUsageOutput: int("tokenUsageOutput"),
  finishReason: varchar("finishReason", { length: 80 }),
  blockedReason: varchar("blockedReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ threadCreatedIdx: index("assistant_messages_thread_created_idx").on(table.threadId, table.createdAt) }));

export const knowledgeSources = mysqlTable("knowledgeSources", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 120 }),
  organizationId: int("organizationId"),
  sourceType: mysqlEnum("sourceType", ["law", "faq", "guide", "tender_doc", "internal_policy", "pricing_reference"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 12 }).notNull(),
  file: varchar("file", { length: 1024 }),
  sourceStatus: mysqlEnum("sourceStatus", ["draft", "active", "archived"]).default("draft").notNull(),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  confidentialityLevel: mysqlEnum("confidentialityLevel", ["public", "internal", "restricted"]).default("internal").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ scopeStatusIdx: index("knowledge_sources_scope_status_idx").on(table.organizationId, table.sourceStatus) }));

export const knowledgeChunks = mysqlTable("knowledgeChunks", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  chunkText: text("chunkText").notNull(),
  embeddingRef: varchar("embeddingRef", { length: 255 }),
  metadataJson: text("metadataJson"),
  tenantId: varchar("tenantId", { length: 120 }),
  organizationId: int("organizationId"),
  roleWhitelistJson: text("roleWhitelistJson"),
  entityWhitelistJson: text("entityWhitelistJson"),
  contextType: varchar("contextType", { length: 80 }),
  contextObjectId: int("contextObjectId"),
  documentType: varchar("documentType", { length: 120 }),
  legalBasis: varchar("legalBasis", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ sourceChunkUnique: uniqueIndex("knowledge_chunks_source_index_unique").on(table.sourceId, table.chunkIndex), retrievalScopeIdx: index("knowledge_chunks_retrieval_scope_idx").on(table.organizationId, table.contextType, table.contextObjectId) }));

export const assistantPolicies = mysqlTable("assistantPolicies", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  roleCode: varchar("roleCode", { length: 40 }).notNull(),
  policyType: mysqlEnum("policyType", ["retrieval", "answer", "action", "redaction"]).notNull(),
  policyJson: text("policyJson").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ profileRolePolicyIdx: index("assistant_policies_profile_role_idx").on(table.profileId, table.roleCode, table.policyType) }));

export const assistantAuditLogs = mysqlTable("assistantAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  threadId: int("threadId"),
  messageId: int("messageId"),
  actionType: mysqlEnum("actionType", ["ask", "retrieve", "answer", "block", "escalate"]).notNull(),
  intentLabel: varchar("intentLabel", { length: 80 }),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low").notNull(),
  retrievedChunkCount: int("retrievedChunkCount").default(0).notNull(),
  modelName: varchar("modelName", { length: 120 }),
  latencyMs: int("latencyMs"),
  decisionJson: text("decisionJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userActionIdx: index("assistant_audit_user_action_idx").on(table.userId, table.actionType, table.createdAt) }));

export const assistantFeedback = mysqlTable("assistantFeedback", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  rating: mysqlEnum("rating", ["useful", "not_useful"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ messageUserUnique: uniqueIndex("assistant_feedback_message_user_unique").on(table.messageId, table.userId) }));
