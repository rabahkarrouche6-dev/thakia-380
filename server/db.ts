import { and, desc, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {   InsertUser,
  adminDelegations,
  billingEventLogs,
  upgradeRequestNotifications,
  featureUsageLedger,
  planFeatures,
  plans,
  subscriptions,
  subscriptionEntitlementSnapshots,
  auditLogs,
  awardDecisions,
  bids,
  bidDocuments,
  bidOpeningSessions,
  bidOpeningCommitteeMembers,
  bidOpeningMinutes,
  bidOpeningMinutesSignatures,
  profiles,
  operatorDeclarations,
  operatorDocuments,
  operatorProfiles,
  supplierContracts,
  supplierOperationalAlerts,
  authorityOperationalAlerts,
  tenderDocuments,
  smartTenderDocuments,
  smartTenderDocumentVersions,
  smartTenderDocumentReviews,
  aiAuditLogs,
  assistantThreads,
  assistantMessages,
  assistantFeedback,
  tenders,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isAdminDelegationActive, scopeAllows } from "./stateMachine";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function recordBillingEvent(input: typeof billingEventLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(billingEventLogs).values(input).onDuplicateKeyUpdate({ set: { result: input.result, metadata: input.metadata ?? null } });
  const rows = await db.select().from(billingEventLogs).where(eq(billingEventLogs.eventKey, input.eventKey)).limit(1);
  return rows[0];
}

export async function createUpgradeRequestNotification(input: typeof upgradeRequestNotifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(upgradeRequestNotifications).values(input).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });
  const rows = await db.select().from(upgradeRequestNotifications).where(eq(upgradeRequestNotifications.eventKey, input.eventKey)).limit(1);
  return rows[0];
}

export async function listUpgradeRequestNotifications(accountUserId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return db.select().from(upgradeRequestNotifications)
    .where(eq(upgradeRequestNotifications.accountUserId, accountUserId))
    .orderBy(desc(upgradeRequestNotifications.createdAt))
    .limit(safeLimit);
}

export async function markUpgradeRequestNotificationsRead(accountUserId: number, notificationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const condition = notificationId
    ? and(eq(upgradeRequestNotifications.accountUserId, accountUserId), eq(upgradeRequestNotifications.id, notificationId))
    : eq(upgradeRequestNotifications.accountUserId, accountUserId);
  await db.update(upgradeRequestNotifications).set({ readAt: new Date() }).where(and(condition, isNull(upgradeRequestNotifications.readAt)));
  return { success: true } as const;
}

export async function updateUpgradeRequestNotificationStatus(accountUserId: number, eventKey: string, status: "pending_contact" | "approved" | "rejected" | "needs_info", title: string, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(upgradeRequestNotifications)
    .set({ status, title, message, readAt: null, updatedAt: new Date() })
    .where(and(eq(upgradeRequestNotifications.accountUserId, accountUserId), eq(upgradeRequestNotifications.eventKey, eventKey)));
  if (Number(result[0]?.affectedRows ?? 0) !== 1) return undefined;
  const rows = await db.select().from(upgradeRequestNotifications).where(eq(upgradeRequestNotifications.eventKey, eventKey)).limit(1);
  return rows[0];
}

export async function listSupplierContracts(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: supplierContracts.id,
    tenderId: supplierContracts.tenderId,
    winningBidId: supplierContracts.winningBidId,
    contractReference: supplierContracts.contractReference,
    amount: supplierContracts.amount,
    currency: supplierContracts.currency,
    status: supplierContracts.status,
    awardedAt: supplierContracts.awardedAt,
    createdAt: supplierContracts.createdAt,
    tenderReference: tenders.reference,
    tenderTitle: tenders.title,
    tenderCategory: tenders.category,
    tenderLocation: tenders.location,
    authorityId: tenders.authorityId,
    decisionNotes: awardDecisions.notes,
    decidedAt: awardDecisions.decidedAt,
  }).from(supplierContracts)
    .innerJoin(tenders, eq(supplierContracts.tenderId, tenders.id))
    .leftJoin(awardDecisions, eq(awardDecisions.tenderId, supplierContracts.tenderId))
    .where(eq(supplierContracts.supplierId, supplierId))
    .orderBy(desc(supplierContracts.awardedAt));
}

export async function listAuthorityContracts(authorityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: supplierContracts.id,
    tenderId: supplierContracts.tenderId,
    supplierId: supplierContracts.supplierId,
    contractReference: supplierContracts.contractReference,
    amount: supplierContracts.amount,
    currency: supplierContracts.currency,
    status: supplierContracts.status,
    awardedAt: supplierContracts.awardedAt,
    updatedAt: supplierContracts.updatedAt,
    tenderReference: tenders.reference,
    tenderTitle: tenders.title,
    supplierName: users.name,
  }).from(supplierContracts)
    .innerJoin(tenders, eq(supplierContracts.tenderId, tenders.id))
    .leftJoin(users, eq(supplierContracts.supplierId, users.id))
    .where(eq(tenders.authorityId, authorityId))
    .orderBy(desc(supplierContracts.updatedAt));
}

export async function getAuthorityContract(contractId: number, authorityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({
    id: supplierContracts.id,
    tenderId: supplierContracts.tenderId,
    supplierId: supplierContracts.supplierId,
    contractReference: supplierContracts.contractReference,
    amount: supplierContracts.amount,
    currency: supplierContracts.currency,
    status: supplierContracts.status,
    tenderReference: tenders.reference,
    tenderTitle: tenders.title,
  }).from(supplierContracts)
    .innerJoin(tenders, eq(supplierContracts.tenderId, tenders.id))
    .where(and(eq(supplierContracts.id, contractId), eq(tenders.authorityId, authorityId)))
    .limit(1);
  return rows[0];
}

export async function updateAuthorityContractStatus(contractId: number, expectedStatus: typeof supplierContracts.status.enumValues[number], nextStatus: typeof supplierContracts.status.enumValues[number]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(supplierContracts)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(supplierContracts.id, contractId), eq(supplierContracts.status, expectedStatus)));
  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export async function createSupplierOperationalAlert(input: typeof supplierOperationalAlerts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(supplierOperationalAlerts).values(input).onDuplicateKeyUpdate({
    set: { title: input.title, message: input.message, severity: input.severity, readAt: null, updatedAt: new Date() },
  });
  const rows = await db.select().from(supplierOperationalAlerts).where(eq(supplierOperationalAlerts.eventKey, input.eventKey)).limit(1);
  return rows[0];
}

export async function listAuthorityTenderDocuments(authorityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: tenderDocuments.id,
    tenderId: tenderDocuments.tenderId,
    fileName: tenderDocuments.fileName,
    mimeType: tenderDocuments.mimeType,
    sizeBytes: tenderDocuments.sizeBytes,
    createdAt: tenderDocuments.createdAt,
    tenderReference: tenders.reference,
    tenderTitle: tenders.title,
    tenderStatus: tenders.status,
  }).from(tenderDocuments)
    .innerJoin(tenders, eq(tenderDocuments.tenderId, tenders.id))
    .where(eq(tenders.authorityId, authorityId))
    .orderBy(desc(tenderDocuments.createdAt));
}

export async function listSupplierOperationalAlerts(supplierId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return db.select().from(supplierOperationalAlerts)
    .where(eq(supplierOperationalAlerts.supplierId, supplierId))
    .orderBy(desc(supplierOperationalAlerts.createdAt))
    .limit(safeLimit);
}

export async function markSupplierOperationalAlertsRead(supplierId: number, alertId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const scope = alertId
    ? and(eq(supplierOperationalAlerts.supplierId, supplierId), eq(supplierOperationalAlerts.id, alertId))
    : eq(supplierOperationalAlerts.supplierId, supplierId);
  await db.update(supplierOperationalAlerts).set({ readAt: new Date() }).where(and(scope, isNull(supplierOperationalAlerts.readAt)));
  return { success: true } as const;
}

export async function createAuthorityOperationalAlert(input: typeof authorityOperationalAlerts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(authorityOperationalAlerts).values(input).onDuplicateKeyUpdate({
    set: { title: input.title, message: input.message, severity: input.severity, updatedAt: new Date() },
  });
  const rows = await db.select().from(authorityOperationalAlerts).where(eq(authorityOperationalAlerts.eventKey, input.eventKey)).limit(1);
  return rows[0];
}

export async function listAuthorityOperationalAlerts(authorityId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return db.select().from(authorityOperationalAlerts)
    .where(eq(authorityOperationalAlerts.authorityId, authorityId))
    .orderBy(desc(authorityOperationalAlerts.createdAt))
    .limit(safeLimit);
}

export async function markAuthorityOperationalAlertsRead(authorityId: number, alertId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const scope = alertId
    ? and(eq(authorityOperationalAlerts.authorityId, authorityId), eq(authorityOperationalAlerts.id, alertId))
    : eq(authorityOperationalAlerts.authorityId, authorityId);
  await db.update(authorityOperationalAlerts).set({ readAt: new Date() }).where(and(scope, isNull(authorityOperationalAlerts.readAt)));
  return { success: true } as const;
}

export async function listPlans(audience?: "supplier" | "authority") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(plans.isActive, 1), eq(plans.isArchived, 0)];
  if (audience) conditions.push(eq(plans.audience, audience));
  return db.select().from(plans).where(and(...conditions)).orderBy(plans.priceDzd, plans.billingCycle);
}

export async function listPlanFeatures(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planFeatures).where(eq(planFeatures.planId, planId)).orderBy(planFeatures.featureCode);
}

export async function getSubscriptionForUser(accountUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.accountUserId, accountUserId)).limit(1);
  return rows[0];
}

export async function getEntitlementSnapshot(subscriptionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionEntitlementSnapshots).where(eq(subscriptionEntitlementSnapshots.subscriptionId, subscriptionId)).orderBy(subscriptionEntitlementSnapshots.featureCode);
}

export async function ensureFreeSubscription(accountUserId: number, audience: "supplier" | "authority") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getSubscriptionForUser(accountUserId);
  if (existing) return existing;
  const freePlan = await db.select().from(plans).where(and(eq(plans.audience, audience), eq(plans.billingCycle, "free"), eq(plans.isActive, 1), eq(plans.isArchived, 0))).limit(1);
  if (!freePlan[0]) throw new Error("Free baseline plan is not configured");
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
  const result = await db.insert(subscriptions).values({ accountUserId, planId: freePlan[0].id, status: "active", startsAt: now, currentPeriodStart: now, currentPeriodEnd: periodEnd });
  const created = await getSubscriptionForUser(accountUserId);
  if (created) {
    const features = await listPlanFeatures(freePlan[0].id);
    if (features.length) await db.insert(subscriptionEntitlementSnapshots).values(features.map(feature => ({ subscriptionId: created.id, featureCode: feature.featureCode, entitlementType: feature.entitlementType, enabled: feature.enabled, quotaLimit: feature.quotaLimit, seatLimit: feature.seatLimit, configurationJson: feature.configurationJson })));
    await db.insert(billingEventLogs).values({ eventKey: `subscription-free:${created.id}`, eventType: "free_subscription_created", accountUserId, subscriptionId: created.id, result: "success", metadata: JSON.stringify({ planCode: freePlan[0].code }) });
  }
  return created;
}

export async function getUsage(accountUserId: number, featureCode: string, periodStart: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(featureUsageLedger).where(and(eq(featureUsageLedger.accountUserId, accountUserId), eq(featureUsageLedger.featureCode, featureCode), eq(featureUsageLedger.periodStart, periodStart))).limit(1);
  return rows[0];
}

export async function reserveFeatureUsage(accountUserId: number, featureCode: string, periodStart: Date, periodEnd: Date, quotaLimit: number, units = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!Number.isInteger(units) || units < 1 || !Number.isInteger(quotaLimit) || quotaLimit < units) return false;

  const existing = await getUsage(accountUserId, featureCode, periodStart);
  if (existing) {
    const result = await db.update(featureUsageLedger)
      .set({ units: sql`${featureUsageLedger.units} + ${units}`, lastEventAt: new Date() })
      .where(and(
        eq(featureUsageLedger.id, existing.id),
        sql`${featureUsageLedger.units} + ${units} <= ${quotaLimit}`,
      ));
    return Number(result[0]?.affectedRows ?? 0) === 1;
  }

  try {
    await db.insert(featureUsageLedger).values({ accountUserId, featureCode, periodStart, periodEnd, units, lastEventAt: new Date() });
    return true;
  } catch (error) {
    // A concurrent first write may win the unique window; retry through the conditional update.
    const current = await getUsage(accountUserId, featureCode, periodStart);
    if (!current) throw error;
    const result = await db.update(featureUsageLedger)
      .set({ units: sql`${featureUsageLedger.units} + ${units}`, lastEventAt: new Date() })
      .where(and(eq(featureUsageLedger.id, current.id), sql`${featureUsageLedger.units} + ${units} <= ${quotaLimit}`));
    return Number(result[0]?.affectedRows ?? 0) === 1;
  }
}

export async function incrementUsage(accountUserId: number, featureCode: string, periodStart: Date, periodEnd: Date, units: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getUsage(accountUserId, featureCode, periodStart);
  if (existing) {
    await db.update(featureUsageLedger).set({ units: sql`${featureUsageLedger.units} + ${units}`, lastEventAt: new Date() }).where(eq(featureUsageLedger.id, existing.id));
    return getUsage(accountUserId, featureCode, periodStart);
  }
  await db.insert(featureUsageLedger).values({ accountUserId, featureCode, periodStart, periodEnd, units, lastEventAt: new Date() });
  return getUsage(accountUserId, featureCode, periodStart);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.themePreference !== undefined) {
    values.themePreference = user.themePreference;
    updateSet.themePreference = user.themePreference;
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function updateUserThemePreference(userId: number, themePreference: "light" | "dark" | "system") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ themePreference }).where(eq(users.id, userId));
  const result = await db.select({ themePreference: users.themePreference }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.themePreference ?? themePreference;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listProfilesByUserIds(userIds: number[]) {
  const db = await getDb();
  if (!db || !userIds.length) return [];
  return db.select().from(profiles).where(inArray(profiles.userId, userIds));
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function saveProfile(userId: number, input: Partial<typeof profiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getProfile(userId);
  if (existing) {
    await db.update(profiles).set({ ...input, updatedAt: new Date() }).where(eq(profiles.userId, userId));
    return getProfile(userId);
  }
  await db.insert(profiles).values({ userId, completion: input.completion ?? 65, ...input });
  return getProfile(userId);
}

export async function getOperatorProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operatorProfiles).where(eq(operatorProfiles.userId, userId)).limit(1);
  return result[0];
}

/** بيانات سجل مركزية مصغّرة؛ لا تُظهر البريد أو معرّفات الهوية أو بيانات الحسابات البنكية. */
export async function listCentralAuthorityRegistry() {
  const db = await getDb();
  if (!db) return [];
  const approved = await db.select({
    userId: users.id,
    displayName: users.name,
    organizationName: profiles.organizationName,
    registrationNumber: profiles.registrationNumber,
    profileCompletion: profiles.completion,
    updatedAt: profiles.updatedAt,
    requestedAt: sql<Date | null>`null`,
  }).from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.role, "authority"))
    .orderBy(desc(users.updatedAt))
    .limit(200);

  const pending = await db.select({
    userId: users.id,
    displayName: users.name,
    organizationName: profiles.organizationName,
    registrationNumber: profiles.registrationNumber,
    profileCompletion: profiles.completion,
    updatedAt: profiles.updatedAt,
    requestedAt: auditLogs.createdAt,
  }).from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.actorId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(
      eq(users.role, "user"),
      eq(auditLogs.action, "authority_role_requested"),
      eq(auditLogs.result, "pending"),
    ))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  const rejected = await db.select({
    userId: users.id,
    displayName: users.name,
    organizationName: profiles.organizationName,
    registrationNumber: profiles.registrationNumber,
    profileCompletion: profiles.completion,
    updatedAt: profiles.updatedAt,
    requestedAt: auditLogs.createdAt,
    decisionMetadata: auditLogs.metadata,
  }).from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.entityId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(
      eq(users.role, "user"),
      eq(auditLogs.action, "authority_role_rejected"),
      eq(auditLogs.result, "rejected"),
    ))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  const rejectedIds = new Set(rejected.map(row => row.userId));
  return [
    ...pending.filter(row => !rejectedIds.has(row.userId)).map(row => ({ ...row, approvalStatus: "pending" as const })),
    ...rejected.map(row => ({ ...row, approvalStatus: "rejected" as const, rejectionReason: (() => { try { return JSON.parse(row.decisionMetadata || "{}").reason || ""; } catch { return ""; } })() })),
    ...approved.map(row => ({ ...row, approvalStatus: "approved" as const })),
  ];
}

/** يمنع تكرار طلبات اعتماد المصلحة ويستعمل في مسار ما بعد OAuth فقط. */
export async function hasAuthorityApprovalRequest(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const [request] = await db.select({ id: auditLogs.id }).from(auditLogs)
    .where(and(eq(auditLogs.actorId, userId), eq(auditLogs.action, "authority_role_requested"), eq(auditLogs.result, "pending")))
    .orderBy(desc(auditLogs.id))
    .limit(1);
  const [decision] = await db.select({ id: auditLogs.id }).from(auditLogs)
    .where(and(eq(auditLogs.entityId, userId), eq(auditLogs.action, "authority_role_rejected"), eq(auditLogs.result, "rejected")))
    .orderBy(desc(auditLogs.id))
    .limit(1);
  return Boolean(request && (!decision || request.id > decision.id));
}

/** سجل المتعاملين يعرض معلومات الحوكمة اللازمة للمراجعة فقط، بلا معلومات ضريبية أو مصرفية. */
export async function listCentralOperatorRegistry() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    userId: users.id,
    displayName: users.name,
    legalName: operatorProfiles.legalName,
    operatorType: operatorProfiles.operatorType,
    wilayaCode: operatorProfiles.wilayaCode,
    profileStatus: operatorProfiles.status,
    declaredAt: operatorProfiles.declaredAt,
    updatedAt: operatorProfiles.updatedAt,
  }).from(users)
    .leftJoin(operatorProfiles, eq(operatorProfiles.userId, users.id))
    .where(eq(users.role, "supplier"))
    .orderBy(desc(users.updatedAt))
    .limit(200);
}

export async function saveOperatorProfile(userId: number, input: Partial<typeof operatorProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getOperatorProfile(userId);
  if (existing) {
    await db.update(operatorProfiles).set({ ...input, updatedAt: new Date() }).where(eq(operatorProfiles.userId, userId));
  } else {
    await db.insert(operatorProfiles).values({ userId, operatorType: "مؤسسة", legalName: input.legalName || "", ...input });
  }
  return getOperatorProfile(userId);
}

export async function listOperatorDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operatorDocuments).where(eq(operatorDocuments.userId, userId)).orderBy(desc(operatorDocuments.createdAt));
}

export async function getOperatorDocumentForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operatorDocuments).where(and(eq(operatorDocuments.id, id), eq(operatorDocuments.userId, userId))).limit(1);
  return result[0];
}

export async function createOperatorDocument(input: typeof operatorDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(operatorDocuments).values(input);
  const rows = await db.select().from(operatorDocuments).where(eq(operatorDocuments.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function deleteOperatorDocument(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(operatorDocuments).where(and(eq(operatorDocuments.id, id), eq(operatorDocuments.userId, userId)));
}

export async function createOperatorDeclaration(input: typeof operatorDeclarations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(operatorDeclarations).values(input);
  const rows = await db.select().from(operatorDeclarations).where(eq(operatorDeclarations.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function listOperatorDeclarations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operatorDeclarations).where(eq(operatorDeclarations.userId, userId)).orderBy(desc(operatorDeclarations.acceptedAt));
}

export async function listAllTenders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenders).orderBy(desc(tenders.createdAt));
}

export async function listPublishedTenders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenders).where(and(eq(tenders.status, "published"), gt(tenders.deadline, new Date()))).orderBy(desc(tenders.publishedAt));
}

export async function listTendersForAuthority(authorityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenders).where(eq(tenders.authorityId, authorityId)).orderBy(desc(tenders.createdAt));
}

export async function getTender(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
  return result[0];
}

export async function createTender(input: typeof tenders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(tenders).values(input);
  return getTender(Number(result[0].insertId));
}

export async function updateTender(id: number, authorityId: number, input: Partial<typeof tenders.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(tenders).set({ ...input, updatedAt: new Date() }).where(and(eq(tenders.id, id), eq(tenders.authorityId, authorityId)));
  return getTender(id);
}

export async function transitionTenderState(id: number, authorityId: number, from: typeof tenders.$inferSelect["status"], to: typeof tenders.$inferSelect["status"], extra: Partial<typeof tenders.$inferInsert> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(tenders).set({ ...extra, status: to, updatedAt: new Date() }).where(and(eq(tenders.id, id), eq(tenders.authorityId, authorityId), eq(tenders.status, from)));
  if (!result[0] || Number(result[0].affectedRows ?? 0) !== 1) return undefined;
  return getTender(id);
}

export async function transitionTenderStateById(id: number, from: typeof tenders.$inferSelect["status"], to: typeof tenders.$inferSelect["status"], extra: Partial<typeof tenders.$inferInsert> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(tenders).set({ ...extra, status: to, updatedAt: new Date() }).where(and(eq(tenders.id, id), eq(tenders.status, from)));
  if (!result[0] || Number(result[0].affectedRows ?? 0) !== 1) return undefined;
  return getTender(id);
}

export async function createAdminDelegation(input: typeof adminDelegations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.expiresAt <= input.startsAt) throw new Error("Delegation expiry must be after start");
  const result = await db.insert(adminDelegations).values(input);
  const rows = await db.select().from(adminDelegations).where(eq(adminDelegations.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function listAdminDelegations(adminUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminDelegations).where(eq(adminDelegations.adminUserId, adminUserId)).orderBy(desc(adminDelegations.createdAt));
}

export async function revokeAdminDelegation(id: number, adminUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(adminDelegations).set({ revokedAt: new Date() }).where(and(eq(adminDelegations.id, id), eq(adminDelegations.adminUserId, adminUserId), isNull(adminDelegations.revokedAt)));
  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export async function hasActiveAdminDelegation(adminUserId: number, authorityUserId: number, scope: "manage" | "decide", at = new Date()) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({
    id: adminDelegations.id,
    scope: adminDelegations.scope,
    startsAt: adminDelegations.startsAt,
    expiresAt: adminDelegations.expiresAt,
    revokedAt: adminDelegations.revokedAt,
  }).from(adminDelegations).where(and(eq(adminDelegations.adminUserId, adminUserId), eq(adminDelegations.authorityUserId, authorityUserId)));
  return rows.some(row => isAdminDelegationActive(row, at) && scopeAllows(row.scope, scope));
}

export async function listAllBids() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).orderBy(desc(bids.createdAt));
}

export async function listBidsForTender(tenderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.tenderId, tenderId)).orderBy(desc(bids.createdAt));
}

export async function getBidOpeningSession(tenderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bidOpeningSessions).where(eq(bidOpeningSessions.tenderId, tenderId)).limit(1);
  return result[0];
}

export async function listOpeningCommittee(tenderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bidOpeningCommitteeMembers).where(and(eq(bidOpeningCommitteeMembers.tenderId, tenderId), isNull(bidOpeningCommitteeMembers.revokedAt))).orderBy(bidOpeningCommitteeMembers.appointedAt);
}

export async function getActiveOpeningCommitteeMember(tenderId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(bidOpeningCommitteeMembers).where(and(eq(bidOpeningCommitteeMembers.tenderId, tenderId), eq(bidOpeningCommitteeMembers.userId, userId), isNull(bidOpeningCommitteeMembers.revokedAt))).limit(1);
  return rows[0];
}

export async function appointOpeningCommitteeMember(input: typeof bidOpeningCommitteeMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(bidOpeningCommitteeMembers).where(and(eq(bidOpeningCommitteeMembers.tenderId, input.tenderId), eq(bidOpeningCommitteeMembers.userId, input.userId))).limit(1);
  if (existing[0]?.revokedAt) {
    await db.update(bidOpeningCommitteeMembers).set({ role: input.role, appointedBy: input.appointedBy, appointedAt: new Date(), revokedAt: null }).where(eq(bidOpeningCommitteeMembers.id, existing[0].id));
    return getActiveOpeningCommitteeMember(input.tenderId, input.userId);
  }
  if (existing[0]) return existing[0];
  const result = await db.insert(bidOpeningCommitteeMembers).values(input);
  const rows = await db.select().from(bidOpeningCommitteeMembers).where(eq(bidOpeningCommitteeMembers.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function revokeOpeningCommitteeMember(tenderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(bidOpeningCommitteeMembers).set({ revokedAt: new Date() }).where(and(eq(bidOpeningCommitteeMembers.tenderId, tenderId), eq(bidOpeningCommitteeMembers.userId, userId), isNull(bidOpeningCommitteeMembers.revokedAt)));
  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export async function getBidOpeningMinutes(tenderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(bidOpeningMinutes).where(eq(bidOpeningMinutes.tenderId, tenderId)).limit(1);
  return rows[0];
}

export async function listOpeningMinutesSignatures(tenderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bidOpeningMinutesSignatures).where(eq(bidOpeningMinutesSignatures.tenderId, tenderId)).orderBy(bidOpeningMinutesSignatures.signedAt);
}

export async function signOpeningMinutes(tenderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    return await db.transaction(async tx => {
      const minutesRows = await tx.select().from(bidOpeningMinutes).where(eq(bidOpeningMinutes.tenderId, tenderId)).limit(1);
      const minutes = minutesRows[0];
      if (!minutes || minutes.approvalStatus === "approved") {
        const signatures = await tx.select().from(bidOpeningMinutesSignatures).where(eq(bidOpeningMinutesSignatures.tenderId, tenderId)).orderBy(bidOpeningMinutesSignatures.signedAt);
        return { minutes, signature: signatures.find(item => item.userId === userId), signatures, alreadySigned: Boolean(signatures.find(item => item.userId === userId)), approved: minutes?.approvalStatus === "approved" };
      }

      const memberRows = await tx.select().from(bidOpeningCommitteeMembers).where(and(eq(bidOpeningCommitteeMembers.tenderId, tenderId), eq(bidOpeningCommitteeMembers.userId, userId), isNull(bidOpeningCommitteeMembers.revokedAt))).limit(1);
      const member = memberRows[0];
      if (!member) throw new Error("Opening committee membership required");

      const existingRows = await tx.select().from(bidOpeningMinutesSignatures).where(and(eq(bidOpeningMinutesSignatures.minutesId, minutes.id), eq(bidOpeningMinutesSignatures.userId, userId))).limit(1);
      if (existingRows[0]) {
        const signatures = await tx.select().from(bidOpeningMinutesSignatures).where(eq(bidOpeningMinutesSignatures.tenderId, tenderId)).orderBy(bidOpeningMinutesSignatures.signedAt);
        return { minutes, signature: existingRows[0], signatures, alreadySigned: true, approved: false };
      }

      const signedAt = new Date();
      const signatureDigest = createHash("sha256").update(`${minutes.contentDigest}|${minutes.id}|${tenderId}|${userId}|${member.role}|${signedAt.toISOString()}`).digest("hex");
      const inserted = await tx.insert(bidOpeningMinutesSignatures).values({ minutesId: minutes.id, tenderId, userId, memberRole: member.role, signatureAlgorithm: "SHA256-IDENTITY-BOUND", signatureDigest, signedAt });
      const signatureRows = await tx.select().from(bidOpeningMinutesSignatures).where(eq(bidOpeningMinutesSignatures.id, Number(inserted[0].insertId))).limit(1);
      const signatures = await tx.select().from(bidOpeningMinutesSignatures).where(eq(bidOpeningMinutesSignatures.tenderId, tenderId)).orderBy(bidOpeningMinutesSignatures.signedAt);
      const committee = await tx.select().from(bidOpeningCommitteeMembers).where(and(eq(bidOpeningCommitteeMembers.tenderId, tenderId), isNull(bidOpeningCommitteeMembers.revokedAt)));
      const quorum = Math.max(2, Math.ceil(committee.length / 2));
      const approved = signatures.length >= quorum;
      if (approved) await tx.update(bidOpeningMinutes).set({ approvalStatus: "approved", approvedAt: signedAt }).where(and(eq(bidOpeningMinutes.id, minutes.id), eq(bidOpeningMinutes.approvalStatus, "pending")));
      const updatedMinutesRows = await tx.select().from(bidOpeningMinutes).where(eq(bidOpeningMinutes.id, minutes.id)).limit(1);
      return { minutes: updatedMinutesRows[0], signature: signatureRows[0], signatures, quorum, alreadySigned: false, approved: updatedMinutesRows[0]?.approvalStatus === "approved" };
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const minutes = await getBidOpeningMinutes(tenderId);
      const signatures = await listOpeningMinutesSignatures(tenderId);
      return { minutes, signature: signatures.find(item => item.userId === userId), signatures, alreadySigned: true, approved: minutes?.approvalStatus === "approved" };
    }
    throw error;
  }
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY");
}

export async function openTenderBids(tenderId: number, openedBy: number, scheduledAt: Date, committeeMemberIds: number[], quorum: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    return await db.transaction(async tx => {
      const existing = await tx.select().from(bidOpeningSessions).where(eq(bidOpeningSessions.tenderId, tenderId)).limit(1);
      if (existing[0]) return { session: existing[0], alreadyOpened: true as const };
      const now = new Date();
      const submitted = await tx.select().from(bids).where(and(eq(bids.tenderId, tenderId), eq(bids.status, "submitted")));
      if (committeeMemberIds.length < quorum) throw new Error("Opening quorum not met");
      const openedBids = submitted.map(bid => ({ bidId: bid.id, supplierId: bid.supplierId, submittedAt: bid.submittedAt?.toISOString() ?? null, amount: bid.amount, proposal: bid.proposal }));
      const content = JSON.stringify({ tenderId, serverOpenedAt: now.toISOString(), scheduledOpeningAt: scheduledAt.toISOString(), openedBy, quorum, committeeMemberIds, submittedCount: submitted.length, openedBids, exceptions: [] });
      const inserted = await tx.insert(bidOpeningSessions).values({ tenderId, status: "opened", scheduledAt, openedAt: now, openedBy, submittedCount: submitted.length, minutes: null });
      const sessionId = Number(inserted[0].insertId);
      await tx.update(bids).set({ status: "under_review", openedAt: now }).where(and(eq(bids.tenderId, tenderId), eq(bids.status, "submitted")));
      await tx.insert(bidOpeningMinutes).values({ sessionId, tenderId, generatedBy: openedBy, content, contentDigest: createHash("sha256").update(content).digest("hex") });
      await tx.update(bidOpeningSessions).set({ status: "sealed" }).where(eq(bidOpeningSessions.id, sessionId));
      const session = await tx.select().from(bidOpeningSessions).where(eq(bidOpeningSessions.id, sessionId)).limit(1);
      return { session: session[0], alreadyOpened: false as const };
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await getBidOpeningSession(tenderId);
      if (existing) return { session: existing, alreadyOpened: true as const };
    }
    throw error;
  }
}

export async function listBidsForSupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bids).where(eq(bids.supplierId, supplierId)).orderBy(desc(bids.createdAt));
}

export async function getBid(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return result[0];
}

export async function getBidForTender(bidId: number, tenderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bids).where(and(eq(bids.id, bidId), eq(bids.tenderId, tenderId))).limit(1);
  return result[0];
}

export async function listTenderDocuments(tenderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenderDocuments).where(eq(tenderDocuments.tenderId, tenderId)).orderBy(desc(tenderDocuments.createdAt));
}

export async function getTenderDocument(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenderDocuments).where(eq(tenderDocuments.id, id)).limit(1);
  return result[0];
}

export async function createTenderDocument(input: typeof tenderDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(tenderDocuments).values(input);
  return getTenderDocument(Number(result[0].insertId));
}

export async function listBidDocuments(bidId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bidDocuments).where(eq(bidDocuments.bidId, bidId)).orderBy(desc(bidDocuments.createdAt));
}

export async function getBidDocument(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bidDocuments).where(eq(bidDocuments.id, id)).limit(1);
  return result[0];
}

export async function createBidDocument(input: typeof bidDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(bidDocuments).values(input);
  return getBidDocument(Number(result[0].insertId));
}

export async function createBid(input: typeof bids.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(bids).values(input);
  const created = await db.select().from(bids).where(eq(bids.id, Number(result[0].insertId))).limit(1);
  return created[0];
}

export async function updateBid(id: number, input: Partial<typeof bids.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(bids).set(input).where(eq(bids.id, id));
  const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return result[0];
}

export async function transitionBidState(id: number, from: typeof bids.$inferSelect["status"], to: typeof bids.$inferSelect["status"], extra: Partial<typeof bids.$inferInsert> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(bids).set({ ...extra, status: to }).where(and(eq(bids.id, id), eq(bids.status, from)));
  if (!result[0] || Number(result[0].affectedRows ?? 0) !== 1) return undefined;
  return getBid(id);
}

export async function createAward(input: typeof awardDecisions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(awardDecisions).values(input);
  const result = await db.select().from(awardDecisions).where(eq(awardDecisions.tenderId, input.tenderId)).limit(1);
  return result[0];
}

export async function decideAwardAtomically(input: typeof awardDecisions.$inferInsert, authorityId: number, nextTenderState: "awarded" | "cancelled", supplierContract?: { supplierId: number; winningBidId: number; contractReference: string; amount: number; currency: string; alertTitle: string; alertMessage: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const transition = await tx.update(tenders).set({ status: nextTenderState, updatedAt: new Date() }).where(and(eq(tenders.id, input.tenderId), eq(tenders.authorityId, authorityId), eq(tenders.status, "evaluation")));
    if (!transition[0] || Number(transition[0].affectedRows ?? 0) !== 1) return undefined;
    await tx.insert(awardDecisions).values(input);
    if (supplierContract && nextTenderState === "awarded") {
      await tx.insert(supplierContracts).values({ tenderId: input.tenderId, winningBidId: supplierContract.winningBidId, supplierId: supplierContract.supplierId, contractReference: supplierContract.contractReference, amount: supplierContract.amount, currency: supplierContract.currency, status: "pending_signature", awardedAt: new Date() });
      const contracts = await tx.select().from(supplierContracts).where(eq(supplierContracts.tenderId, input.tenderId)).limit(1);
      const contract = contracts[0];
      if (!contract) throw new Error("Contract register creation failed");
      await tx.insert(supplierOperationalAlerts).values({ supplierId: supplierContract.supplierId, contractId: contract.id, tenderId: input.tenderId, eventKey: `contract_awarded:${input.tenderId}:${supplierContract.supplierId}`, type: "contract_awarded", severity: "success", title: supplierContract.alertTitle, message: supplierContract.alertMessage });
    }
    const result = await tx.select().from(awardDecisions).where(eq(awardDecisions.tenderId, input.tenderId)).orderBy(desc(awardDecisions.id)).limit(1);
    return result[0];
  });
}

export async function createSmartTenderDocument(input: typeof smartTenderDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(smartTenderDocuments).values(input);
  const id = Number(result[0]?.insertId);
  const rows = await db.select().from(smartTenderDocuments).where(and(eq(smartTenderDocuments.id, id), eq(smartTenderDocuments.ownerId, input.ownerId))).limit(1);
  return rows[0];
}

export async function getSmartTenderDocumentForOwner(documentId: number, ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(smartTenderDocuments).where(and(eq(smartTenderDocuments.id, documentId), eq(smartTenderDocuments.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function listSmartTenderDocumentsForOwner(ownerId: number, audience: "supplier" | "authority") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smartTenderDocuments).where(and(eq(smartTenderDocuments.ownerId, ownerId), eq(smartTenderDocuments.audience, audience))).orderBy(desc(smartTenderDocuments.updatedAt));
}

export async function listSmartTenderDocumentVersions(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smartTenderDocumentVersions).where(eq(smartTenderDocumentVersions.documentId, documentId)).orderBy(desc(smartTenderDocumentVersions.versionNumber));
}

export async function createSmartTenderDocumentVersion(input: typeof smartTenderDocumentVersions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(smartTenderDocumentVersions).values(input);
  await db.update(smartTenderDocuments).set({ currentVersionNumber: input.versionNumber, updatedAt: new Date(), completion: sql`LEAST(100, GREATEST(0, ${input.contentJson.length > 2 ? 35 : 0}))` }).where(eq(smartTenderDocuments.id, input.documentId));
  const rows = await db.select().from(smartTenderDocumentVersions).where(and(eq(smartTenderDocumentVersions.documentId, input.documentId), eq(smartTenderDocumentVersions.versionNumber, input.versionNumber))).limit(1);
  return rows[0];
}

export async function listSmartTenderDocumentReviews(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smartTenderDocumentReviews).where(eq(smartTenderDocumentReviews.documentId, documentId)).orderBy(desc(smartTenderDocumentReviews.createdAt));
}

export async function createSmartTenderDocumentReview(input: typeof smartTenderDocumentReviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(smartTenderDocumentReviews).values(input);
  const rows = await db.select().from(smartTenderDocumentReviews).where(and(eq(smartTenderDocumentReviews.documentId, input.documentId), eq(smartTenderDocumentReviews.versionId, input.versionId))).orderBy(desc(smartTenderDocumentReviews.createdAt)).limit(1);
  return rows[0];
}

export async function updateSmartTenderDocumentStatus(documentId: number, ownerId: number, status: typeof smartTenderDocuments.status.enumValues[number]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(smartTenderDocuments).set({ status, updatedAt: new Date() }).where(and(eq(smartTenderDocuments.id, documentId), eq(smartTenderDocuments.ownerId, ownerId)));
  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export async function logAiAudit(input: typeof aiAuditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  const metadata = sanitizeAuditMetadata(input.metadata);
  await db.insert(aiAuditLogs).values({ ...input, metadata });
}

export async function listAiAuditLogs(actorId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAuditLogs).where(eq(aiAuditLogs.actorId, actorId)).orderBy(desc(aiAuditLogs.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

type AuditInput = Omit<typeof auditLogs.$inferInsert, "actorRole"> & {
  actorRole?: string;
};

const SENSITIVE_AUDIT_KEYS = new Set(["password", "token", "secret", "authorization", "content", "documentContent"]);

function sanitizeAuditMetadata(metadata?: string | null) {
  if (!metadata) return metadata;
  try {
    const parsed = JSON.parse(metadata) as unknown;
    const redact = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(redact);
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, child]) => [
            key,
            SENSITIVE_AUDIT_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(child),
          ]),
        );
      }
      return value;
    };
    return JSON.stringify(redact(parsed));
  } catch {
    return "[UNPARSEABLE_METADATA_REDACTED]";
  }
}

export function computeAuditEntryHash(input: {
  actorId: number;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: number | null;
  result: string;
  metadata?: string | null;
  createdAt: Date;
  previousHash: string;
}) {
  const canonical = JSON.stringify({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    result: input.result,
    metadata: input.metadata ?? null,
    createdAt: input.createdAt.toISOString(),
    previousHash: input.previousHash,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function verifyAuditLogChain(entries: Array<{
  id: number;
  actorId: number;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: number | null;
  result: string;
  metadata?: string | null;
  createdAt: Date;
  previousHash?: string | null;
  entryHash?: string | null;
}>) {
  let previousHash = "GENESIS";
  for (const entry of [...entries].sort((left, right) => left.id - right.id)) {
    if (!entry.previousHash || !entry.entryHash || entry.previousHash !== previousHash) return false;
    const expected = computeAuditEntryHash({
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      result: entry.result,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      previousHash: entry.previousHash,
    });
    if (expected !== entry.entryHash) return false;
    previousHash = entry.entryHash;
  }
  return true;
}

export async function logAudit(input: AuditInput) {
  const db = await getDb();
  if (!db) return;
  let actorRole = input.actorRole;
  if (!actorRole) {
    const actor = await db.select({ role: users.role }).from(users).where(eq(users.id, input.actorId)).limit(1);
    actorRole = actor[0]?.role ?? "unknown";
  }
  const metadata = sanitizeAuditMetadata(input.metadata);
  const createdAt = input.createdAt ?? new Date();
  const { actorRole: _ignoredActorRole, createdAt: _ignoredCreatedAt, ...rest } = input;
  await db.transaction(async tx => {
    const [previousRows] = await tx.execute(sql`SELECT entryHash FROM auditLogs WHERE entryHash IS NOT NULL ORDER BY id DESC LIMIT 1 FOR UPDATE`);
    const previousHash = (previousRows as unknown as Array<{ entryHash?: string | null }>)[0]?.entryHash ?? "GENESIS";
    const entryHash = computeAuditEntryHash({ ...rest, actorRole, metadata, createdAt, previousHash });
    await tx.insert(auditLogs).values({
      ...rest,
      actorRole,
      metadata,
      createdAt,
      previousHash,
      entryHash,
    });
  });
}

export async function listAuditLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function listAuditLogsForTender(tenderId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs)
    .where(and(eq(auditLogs.entityType, "tender"), eq(auditLogs.entityId, tenderId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { tenders: 0, published: 0, bids: 0, awarded: 0, audits: 0 };
  const [allTenders, published, allBids, awarded, audits] = await Promise.all([
    db.select().from(tenders),
    db.select().from(tenders).where(eq(tenders.status, "published")),
    db.select().from(bids),
    db.select().from(tenders).where(eq(tenders.status, "awarded")),
    db.select().from(auditLogs),
  ]);
  return { tenders: allTenders.length, published: published.length, bids: allBids.length, awarded: awarded.length, audits: audits.length };
}

export async function getRegulatorOverview() {
  const db = await getDb();
  if (!db) {
    return {
      stats: { tenders: 0, published: 0, evaluation: 0, bids: 0, audits: 0 },
      tenderStatusCounts: {},
      recentAudit: [],
    };
  }

  const [tenderRows, bidRows, auditRows] = await Promise.all([
    db.select({ id: tenders.id, status: tenders.status }).from(tenders),
    db.select({ id: bids.id }).from(bids),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8),
  ]);

  const tenderStatusCounts = tenderRows.reduce<Record<string, number>>((counts, tender) => {
    counts[tender.status] = (counts[tender.status] ?? 0) + 1;
    return counts;
  }, {});

  return {
    stats: {
      tenders: tenderRows.length,
      published: tenderStatusCounts.published ?? 0,
      evaluation: tenderStatusCounts.evaluation ?? 0,
      bids: bidRows.length,
      audits: auditRows.length,
    },
    tenderStatusCounts,
    recentAudit: auditRows,
  };
}


export async function createAssistantThread(input: typeof assistantThreads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(assistantThreads).values(input);
  const rows = await db.select().from(assistantThreads).where(and(eq(assistantThreads.userId, input.userId), eq(assistantThreads.title, input.title))).orderBy(desc(assistantThreads.createdAt)).limit(1);
  return rows[0];
}

export async function listAssistantThreadsForUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return db.select().from(assistantThreads).where(eq(assistantThreads.userId, userId)).orderBy(desc(assistantThreads.createdAt)).limit(safeLimit);
}

export async function createAssistantMessage(input: typeof assistantMessages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(assistantMessages).values(input);
  const rows = await db.select().from(assistantMessages).where(eq(assistantMessages.threadId, input.threadId)).orderBy(desc(assistantMessages.createdAt)).limit(1);
  return rows[0];
}

export async function addAssistantFeedback(input: typeof assistantFeedback.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(assistantFeedback).values(input).onDuplicateKeyUpdate({ set: { rating: input.rating, note: input.note ?? null } });
  const rows = await db.select().from(assistantFeedback).where(and(eq(assistantFeedback.messageId, input.messageId), eq(assistantFeedback.userId, input.userId))).limit(1);
  return rows[0];
}


export async function getAssistantThreadForUser(threadId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(assistantThreads).where(and(eq(assistantThreads.id, threadId), eq(assistantThreads.userId, userId))).limit(1);
  return rows[0];
}
