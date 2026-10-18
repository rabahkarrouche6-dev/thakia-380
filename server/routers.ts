import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  decideAwardAtomically,
  createBid,
  createBidDocument,
  createTender,
  createTenderDocument,
  getPlatformStats,
  getRegulatorOverview,
  listCentralAuthorityRegistry,
  listCentralOperatorRegistry,
  getBid,
  getBidForTender,
  getBidDocument,
  getTenderDocument,
  getBidOpeningSession,
  listAllTenders,
  getProfile,
  getOperatorProfile,
  saveOperatorProfile,
  listOperatorDocuments,
  getOperatorDocumentForUser,
  createOperatorDocument,
  deleteOperatorDocument,
  createOperatorDeclaration,
  listOperatorDeclarations,
  getTender,
  listAuditLogs,
  listAuditLogsForTender,
  listBidDocuments,
  listBidsForSupplier,
  listBidsForTender,
  listAllBids,
  openTenderBids,
  listOpeningCommittee,
  getActiveOpeningCommitteeMember,
  appointOpeningCommitteeMember,
  revokeOpeningCommitteeMember,
  getBidOpeningMinutes,
  listOpeningMinutesSignatures,
  signOpeningMinutes,
  listPublishedTenders,
  listSupplierContracts,
  listAuthorityContracts,
  getAuthorityContract,
  updateAuthorityContractStatus,
  createSupplierOperationalAlert,
  listSupplierOperationalAlerts,
  listProfilesByUserIds,
  listTenderDocuments,
  listAuthorityTenderDocuments,
  listTendersForAuthority,
  logAudit,
  saveProfile,
  updateBid,
  updateTender,
  transitionTenderState,
  transitionTenderStateById,
  transitionBidState,
  createAdminDelegation,
  listAdminDelegations,
  revokeAdminDelegation,
  hasActiveAdminDelegation,
  getUserById,
  getUserByOpenId,
  listPlans,
  listPlanFeatures,
  getSubscriptionForUser,
  getEntitlementSnapshot,
  ensureFreeSubscription,
  getUsage,
  incrementUsage,
  reserveFeatureUsage,
  recordBillingEvent,
  createUpgradeRequestNotification,
  listUpgradeRequestNotifications,
  markUpgradeRequestNotificationsRead,
  markSupplierOperationalAlertsRead,
  createAuthorityOperationalAlert,
  listAuthorityOperationalAlerts,
  markAuthorityOperationalAlertsRead,
  hasAuthorityApprovalRequest,
  upsertUser,
  updateUserThemePreference,
  createAssistantThread,
  listAssistantThreadsForUser,
  getAssistantThreadForUser,
  addAssistantFeedback,
  createSmartTenderDocument,
  getSmartTenderDocumentForOwner,
  listSmartTenderDocumentsForOwner,
  listSmartTenderDocumentVersions,
  createSmartTenderDocumentVersion,
  listSmartTenderDocumentReviews,
  createSmartTenderDocumentReview,
  updateSmartTenderDocumentStatus,
  logAiAudit,
} from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { createHash } from "node:crypto";
import { rankTendersForSupplier } from "./tenderMatching";
import { buildRegulatorAiResult } from "./regulatorAi";
import { buildAuthorityRfpAudit } from "./authorityAi";
import { generateSmartPromptResult } from "./aiAssistant";
import { ENV } from "./_core/env";
import { assertTenderTransition, assertBidTransition, scopeAllows } from "./stateMachine";
import { assertFeatureCode, getBillingPeriodEnd, isProcurementNeutralFeature, resolveEntitlement } from "./subscriptions";
import { answerLegalQuestion, createLegalSummaryPdf, validateLegalReferenceIds } from "./legalFramework";
import { runAiGateway, enforceAiPolicy } from "./aiGateway";
import { prepareAdvisoryRequest } from "./ai_assistant/services/advisoryAssistantService";

function stripStorageMetadata<T extends { storageKey?: unknown; storageUrl?: unknown }>(document: T | undefined) {
  if (!document) return document;
  const { storageKey: _storageKey, storageUrl: _storageUrl, ...safeDocument } = document;
  return safeDocument;
}

const roleProcedure = (roles: string[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "هذا الإجراء غير متاح لهذا الدور" });
    }
    return next();
  });

type Actor = { id: number; role: "user" | "admin" | "supplier" | "authority" | "regulator"; openId: string };

async function canActOnTender(user: Actor | null, tender: { authorityId: number }, scope: "manage" | "decide") {
  if (!user) return false;
  if (user.role === "authority") return tender.authorityId === user.id;
  if (user.role !== "admin") return false;
  if (user.openId === ENV.ownerOpenId) return true;
  return hasActiveAdminDelegation(user.id, tender.authorityId, scope);
}

const tenderInput = z.object({
  title: z.string().min(4),
  description: z.string().min(12),
  category: z.string().min(2),
  budget: z.number().int().positive().optional(),
  location: z.string().optional(),
  deadline: z.coerce.date(),
});

const documentInput = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  dataBase64: z.string().min(1),
});

const allowedDocumentTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const allowedDocumentExtensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);
const maxDocumentBytes = 10 * 1024 * 1024;
const maxDocumentsPerEntity = 20;

export function decodeDocument(input: z.infer<typeof documentInput>) {
  const originalName = input.fileName.trim();
  const extension = originalName.slice(originalName.lastIndexOf(".")).toLowerCase();
  if (!allowedDocumentTypes.has(input.mimeType) || !allowedDocumentExtensions.has(extension) || /[\\/\\0]/.test(originalName) || originalName === "." || originalName === "..") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "امتداد أو نوع الوثيقة غير مسموح به" });
  }
  const base64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) throw new TRPCError({ code: "BAD_REQUEST", message: "محتوى الوثيقة غير صالح" });
  const data = Buffer.from(base64, "base64");
  if (!data.length || data.length > maxDocumentBytes) throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الوثيقة غير صالح أو يتجاوز الحد المسموح" });
  const isPdf = data.subarray(0, 5).toString() === "%PDF-";
  const isOffice = data.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])) || data.subarray(0, 2).equals(Buffer.from([0x50, 0x4b]));
  if ((input.mimeType === "application/pdf" && !isPdf) || (input.mimeType !== "application/pdf" && !isOffice)) throw new TRPCError({ code: "BAD_REQUEST", message: "محتوى الوثيقة لا يطابق نوع MIME المعلن" });
  return data;
}

const validDocumentName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "file").slice(0, 180) || "file";

const operatorDocumentTypes = new Set(["tax_card", "rc_extract", "identity", "other"]);
const operatorDocumentMime = "application/pdf";
const operatorDocumentMaxBytes = 5 * 1024 * 1024;
const operatorDocumentMaxCount = 8;
const declarationVersion = "operator-registration-v1";

export const algerianLegalForms = ["مؤسسة فردية", "EURL", "SARL", "SPA", "SNC", "SCS", "شركة ذات أسهم بالتوصية", "تعاونية", "فرع شركة أجنبية"] as const;

export const operatorProfileInput = z.object({
  operatorType: z.string().trim().min(2).max(80),
  legalForm: z.enum(algerianLegalForms),
  legalName: z.string().trim().min(2).max(255),
  wilayaCode: z.string().regex(/^([0-9]{2})$/).optional().or(z.literal("")),
  taxCenterType: z.enum(["IFU", "RNI", "IBS"]).optional(),
  activityCodes: z.string().max(2000).optional(),
  representativeName: z.string().trim().max(255).optional(),
  representativeQuality: z.string().trim().max(80).optional(),
  nif: z.string().regex(/^[0-9]{15}$/).optional().or(z.literal("")),
  nis: z.string().regex(/^[0-9]{15}$/).optional().or(z.literal("")),
  rc: z.string().regex(/^[A-Za-z0-9-]{3,32}$/).optional().or(z.literal("")),
  taxArticle: z.string().regex(/^[0-9]{11}$/).optional().or(z.literal("")),
  nin: z.string().regex(/^[0-9]{18}$/).optional().or(z.literal("")),
  rib: z.string().regex(/^[0-9]{20}$/).optional().or(z.literal("")),
});

export function decodeOperatorPdf(input: { fileName: string; mimeType: string; dataBase64: string }) {
  const fileName = input.fileName.trim();
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (input.mimeType !== operatorDocumentMime || extension !== ".pdf" || /[\\/\\0]/.test(fileName) || fileName === "." || fileName === "..") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "يُسمح بملفات PDF فقط لهذه الوثائق" });
  }
  const base64 = input.dataBase64.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) throw new TRPCError({ code: "BAD_REQUEST", message: "محتوى الوثيقة غير صالح" });
  const data = Buffer.from(base64, "base64");
  if (!data.length || data.length > operatorDocumentMaxBytes) throw new TRPCError({ code: "BAD_REQUEST", message: "يتجاوز الملف حد 5 ميغابايت أو لا يحتوي على بيانات" });
  if (data.subarray(0, 5).toString() !== "%PDF-") throw new TRPCError({ code: "BAD_REQUEST", message: "محتوى الملف لا يطابق PDF فعلياً" });
  return data;
}

export const appRouter = router({
  landing: router({
    stats: publicProcedure.query(async () => ({
      ...(await getPlatformStats()),
      recordedAt: new Date(),
    })),
    legalAssistant: publicProcedure.input(z.object({
      question: z.string().trim().min(2).max(1200),
      referenceIds: z.array(z.string()).min(1).max(4),
    }).refine(input => validateLegalReferenceIds(input.referenceIds), { message: "يجب اختيار مراجع قانونية مسموحة" })).mutation(async ({ input }) => {
      return answerLegalQuestion(input.question, input.referenceIds);
    }),
    legalSummaryPdf: publicProcedure.input(z.object({
      referenceIds: z.array(z.string()).min(1).max(4),
    }).refine(input => validateLegalReferenceIds(input.referenceIds), { message: "يجب اختيار مراجع قانونية مسموحة" })).mutation(async ({ input }) => {
      const pdf = await createLegalSummaryPdf(input.referenceIds);
      return { fileName: "smart-deals-legal-summary.pdf", mimeType: "application/pdf", dataBase64: pdf.toString("base64") };
    }),
  }),
  subscriptions: router({
    plans: publicProcedure.input(z.object({ audience: z.enum(["supplier", "authority"]).optional() }).optional()).query(async ({ input }) => {
      const audience = input?.audience;
      const rows = await listPlans(audience);
      return Promise.all(rows.map(async plan => ({ ...plan, features: await listPlanFeatures(plan.id) })));
    }),
    me: roleProcedure(["supplier", "authority"]).query(async ({ ctx }) => {
      const audience = ctx.user.role === "supplier" ? "supplier" : "authority";
      const subscription = await ensureFreeSubscription(ctx.user.id, audience);
      if (!subscription) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر تهيئة الاشتراك الأساسي" });
      const snapshots = await getEntitlementSnapshot(subscription.id);
      const planRows = await listPlans(audience);
      const plan = planRows.find(row => row.id === subscription.planId) ?? null;
      return { subscription, plan, entitlements: snapshots };
    }),
    check: roleProcedure(["supplier", "authority"]).input(z.object({ featureCode: z.string().min(2).max(100), units: z.number().int().positive().max(100).default(1) })).query(async ({ ctx, input }) => {
      assertFeatureCode(input.featureCode);
      const audience = ctx.user.role === "supplier" ? "supplier" : "authority";
      const subscription = await ensureFreeSubscription(ctx.user.id, audience);
      const snapshots = subscription ? await getEntitlementSnapshot(subscription.id) : [];
      const snapshot = snapshots.find(row => row.featureCode === input.featureCode);
      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const usage = await getUsage(ctx.user.id, input.featureCode, periodStart);
      const decision = resolveEntitlement(input.featureCode, subscription, snapshot, usage?.units ?? 0, now);
      if (isProcurementNeutralFeature(input.featureCode)) return decision;
      return { ...decision, requestedUnits: input.units, periodStart, periodEnd };
    }),
    requestUpgrade: roleProcedure(["supplier", "authority"]).input(z.object({ planCode: z.string().min(2).max(80) })).mutation(async ({ ctx, input }) => {
      const audience = ctx.user.role === "supplier" ? "supplier" : "authority";
      const rows = await listPlans(audience);
      const plan = rows.find(row => row.code === input.planCode);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "الخطة غير متاحة لهذا الدور" });
      if (plan.billingCycle === "free") throw new TRPCError({ code: "BAD_REQUEST", message: "الخطة الأساسية لا تحتاج إلى ترقية" });
      const eventKey = `upgrade-request:${ctx.user.id}:${plan.code}`;
      await recordBillingEvent({ eventKey, eventType: "upgrade_requested", accountUserId: ctx.user.id, result: "pending", metadata: JSON.stringify({ planCode: plan.code, audience, paymentActivation: "disabled" }) });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "subscription_upgrade_requested", entityType: "plan", entityId: plan.id, result: "pending", metadata: JSON.stringify({ planCode: plan.code, paymentActivation: "disabled" }) });
      await createUpgradeRequestNotification({
        accountUserId: ctx.user.id,
        eventKey,
        planCode: plan.code,
        audience,
        status: "pending_contact",
        title: "طلب الترقية قيد المراجعة",
        message: `تم استلام طلب الترقية إلى باقة ${plan.nameAr}. سيظهر أي تحديث جديد داخل مركز الإشعارات.`,
      });
      return { accepted: true, status: "pending_contact", message: "تم تسجيل طلب الترقية. سيتم التواصل المؤسسي بعد اعتماد بوابة الدفع." };
    }),
    notifications: roleProcedure(["supplier", "authority"]).input(z.object({ limit: z.number().int().min(1).max(50).default(30) }).optional()).query(async ({ ctx, input }) => {
      const rows = await listUpgradeRequestNotifications(ctx.user.id, input?.limit ?? 30);
      return {
        items: rows,
        unreadCount: rows.filter(row => !row.readAt).length,
        refreshedAt: new Date(),
      };
    }),
    markNotificationRead: roleProcedure(["supplier", "authority"]).input(z.object({ notificationId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      return markUpgradeRequestNotificationsRead(ctx.user.id, input.notificationId);
    }),
    markAllNotificationsRead: roleProcedure(["supplier", "authority"]).mutation(async ({ ctx }) => {
      return markUpgradeRequestNotificationsRead(ctx.user.id);
    }),
  }),
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    directLogin: publicProcedure
      .input(
        z.object({
          role: z.enum(["supplier", "authority", "regulator"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const roleConfig: Record<string, { openId: string; name: string; email: string }> = {
          supplier: {
            openId: "quick_supplier_dz",
            name: "مؤسسة الإنجاز (متعامل اقتصادي)",
            email: "supplier@safaqat.dz",
          },
          authority: {
            openId: "quick_authority_dz",
            name: "مديرية التجهيزات العمومية (مصلحة متعاقدة)",
            email: "authority@safaqat.dz",
          },
          regulator: {
            openId: "quick_regulator_dz",
            name: "المرصد الوطني للصفقات العمومية (إدارة مركزية)",
            email: "regulator@safaqat.dz",
          },
        };
        const config = roleConfig[input.role];

        try {
          await upsertUser({
            openId: config.openId,
            name: config.name,
            email: config.email,
            role: input.role,
            lastSignedIn: new Date(),
          });
        } catch {
          // Gracefully continue if DB connection is offline
        }

        let user: any = null;
        try {
          user = await getUserByOpenId(config.openId);
        } catch {
          user = null;
        }

        if (!user) {
          user = {
            id: input.role === "supplier" ? 101 : input.role === "authority" ? 102 : 103,
            openId: config.openId,
            name: config.name,
            email: config.email,
            role: input.role,
            loginMethod: "direct",
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          };
        }

        if (input.role === "supplier" || input.role === "authority") {
          try {
            await ensureFreeSubscription(user.id, input.role);
          } catch {
            // Ignore if free plan is already active or db offline
          }
        }

        const sessionToken = await sdk.createSessionToken(config.openId, { name: config.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        try {
          await logAudit({
            actorId: user.id,
            actorRole: input.role,
            action: "direct_portal_login",
            entityType: "user",
            entityId: user.id,
            result: "success",
            metadata: JSON.stringify({ role: input.role }),
          });
        } catch {
          // Ignore audit log error if db offline
        }

        return { success: true, user, role: input.role, token: sessionToken };
      }),
    setThemePreference: protectedProcedure.input(z.enum(["light", "dark", "system"])).mutation(async ({ ctx, input }) => {
      const themePreference = await updateUserThemePreference(ctx.user.id, input);
      return { themePreference } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    setRole: protectedProcedure.input(z.enum(["supplier", "authority", "regulator"])).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "user") {
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "role_assignment_denied", entityType: "user", entityId: ctx.user.id, result: "denied", metadata: JSON.stringify({ requestedRole: input, reason: "role_already_assigned" }) });
        throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن تغيير الدور بعد اعتماده" });
      }
      if (input !== "supplier") {
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "role_assignment_denied", entityType: "user", entityId: ctx.user.id, result: "denied", metadata: JSON.stringify({ requestedRole: input, reason: "privileged_role_requires_provisioning" }) });
        throw new TRPCError({ code: "FORBIDDEN", message: "يجب اعتماد هذا الدور من الإدارة المختصة" });
      }
      await upsertUser({ openId: ctx.user.openId, role: input });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "role_assigned", entityType: "user", entityId: ctx.user.id, result: "success", metadata: JSON.stringify({ assignedRole: input }) });
      return { success: true, role: input };
    }),
    requestAuthorityApproval: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "user") {
        throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن طلب اعتماد المصلحة بعد تعيين دور للحساب" });
      }
      if (await hasAuthorityApprovalRequest(ctx.user.id)) {
        return { success: true, status: "pending" as const, alreadyRequested: true };
      }
      await logAudit({
        actorId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "authority_role_requested",
        entityType: "user",
        entityId: ctx.user.id,
        result: "pending",
        metadata: JSON.stringify({ requestedRole: "authority" }),
      });
      return { success: true, status: "pending" as const, alreadyRequested: false };
    }),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => (await getProfile(ctx.user.id)) ?? null),
    save: protectedProcedure.input(z.object({ organizationName: z.string().min(2), registrationNumber: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), completion: z.number().int().min(0).max(100).optional() })).mutation(async ({ ctx, input }) => {
      const profile = await saveProfile(ctx.user.id, input);
      await logAudit({ actorId: ctx.user.id, action: "تحديث الملف", entityType: "profile", entityId: ctx.user.id, result: "success" });
      return profile;
    }),
  }),
  operator: router({
    get: roleProcedure(["supplier"]).query(async ({ ctx }) => (await getOperatorProfile(ctx.user.id)) ?? null),
    save: roleProcedure(["supplier"]).input(operatorProfileInput).mutation(async ({ ctx, input }) => {
      const profile = await saveOperatorProfile(ctx.user.id, input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_profile_saved", entityType: "operator_profile", entityId: ctx.user.id, result: "success", metadata: JSON.stringify({ fields: Object.keys(input).filter(key => !["nif", "nis", "rc", "taxArticle", "nin", "rib"].includes(key)) }) });
      return profile;
    }),
    submit: roleProcedure(["supplier"]).mutation(async ({ ctx }) => {
      const profile = await getOperatorProfile(ctx.user.id);
      const documents = await listOperatorDocuments(ctx.user.id);
      if (!profile?.legalName || !profile.legalForm || !profile.nif || !profile.rc || !profile.representativeName || !documents.length) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "أكمل البيانات الأساسية وأضف وثيقة واحدة على الأقل قبل الإرسال" });
      }
      const updated = await saveOperatorProfile(ctx.user.id, { status: "submitted", declaredAt: new Date(), declarationVersion });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_profile_submitted", entityType: "operator_profile", entityId: ctx.user.id, result: "success", metadata: JSON.stringify({ documentCount: documents.length, declarationVersion }) });
      return updated;
    }),
    documents: router({
      list: roleProcedure(["supplier"]).query(({ ctx }) => listOperatorDocuments(ctx.user.id)),
      upload: roleProcedure(["supplier"]).input(z.object({ documentType: z.string(), document: z.object({ fileName: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(1).max(120), dataBase64: z.string().min(1) }) })).mutation(async ({ ctx, input }) => {
        if (!operatorDocumentTypes.has(input.documentType)) throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الوثيقة غير مسموح به" });
        const current = await listOperatorDocuments(ctx.user.id);
        if (current.length >= operatorDocumentMaxCount) throw new TRPCError({ code: "BAD_REQUEST", message: "تم بلوغ الحد الأقصى لوثائق الملف" });
        const data = decodeOperatorPdf(input.document);
        const digest = createHash("sha256").update(data).digest("hex");
        const uploaded = await storagePut(`operator-documents/${ctx.user.id}/${randomUUID()}-${validDocumentName(input.document.fileName)}`, data, operatorDocumentMime);
        const document = await createOperatorDocument({ userId: ctx.user.id, documentType: input.documentType, fileName: input.document.fileName, mimeType: operatorDocumentMime, sizeBytes: data.length, storageKey: uploaded.key, sha256: digest });
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_document_uploaded", entityType: "operator_document", entityId: document?.id, result: "success", metadata: JSON.stringify({ documentType: input.documentType, sizeBytes: data.length }) });
        return stripStorageMetadata(document);
      }),
      download: roleProcedure(["supplier"]).input(z.number()).query(async ({ ctx, input }) => {
        const document = await getOperatorDocumentForUser(input, ctx.user.id);
        if (!document) {
          await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "access_denied", entityType: "operator_document", entityId: input, result: "document_download_forbidden" });
          throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية لتنزيل هذه الوثيقة" });
        }
        const url = await storageGetSignedUrl(document.storageKey);
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_document_downloaded", entityType: "operator_document", entityId: input, result: "success" });
        return { ...stripStorageMetadata(document), url };
      }),
      delete: roleProcedure(["supplier"]).input(z.number()).mutation(async ({ ctx, input }) => {
        const document = await getOperatorDocumentForUser(input, ctx.user.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteOperatorDocument(input, ctx.user.id);
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_document_deleted", entityType: "operator_document", entityId: input, result: "success" });
        return { success: true } as const;
      }),
    }),
    declaration: router({
      list: roleProcedure(["supplier"]).query(({ ctx }) => listOperatorDeclarations(ctx.user.id)),
      accept: roleProcedure(["supplier"]).input(z.object({ declarationType: z.enum(["accuracy", "advisory_only"]), textVersion: z.string().min(1).max(32) })).mutation(async ({ ctx, input }) => {
        if (input.textVersion !== declarationVersion) throw new TRPCError({ code: "BAD_REQUEST", message: "نسخة الإقرار غير صالحة" });
        const declaration = await createOperatorDeclaration({ userId: ctx.user.id, declarationType: input.declarationType, textVersion: input.textVersion });
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "operator_declaration_accepted", entityType: "operator_declaration", entityId: declaration?.id, result: "success", metadata: JSON.stringify({ declarationType: input.declarationType, textVersion: input.textVersion }) });
        return declaration;
      }),
    }),
  }),
  tenders: router({
    published: publicProcedure.query(() => listPublishedTenders()),
    recommended: roleProcedure(["supplier"]).query(async ({ ctx }) => {
      const [profile, published] = await Promise.all([getProfile(ctx.user.id), listPublishedTenders()]);
      const matches = rankTendersForSupplier(profile, published).slice(0, 5);
      const alertableMatches = matches.filter(match => match.matchScore >= 70);
      await Promise.all(alertableMatches.map(match => createSupplierOperationalAlert({
        supplierId: ctx.user.id,
        tenderId: match.tenderId,
        eventKey: `tender-match:${ctx.user.id}:${match.tenderId}:${match.algorithmVersion}`,
        type: "tender_match",
        severity: match.matchScore >= 85 ? "success" : "info",
        title: "صفقة مطابقة لملفك",
        message: `عثر المساعد على صفقة ${match.reference} بدرجة تطابق وصفية ${match.matchScore}%. راجع دفتر الشروط والأهلية بنفسك قبل اتخاذ قرار التقديم.`,
      })));
      return matches;
    }),
    mine: roleProcedure(["authority", "admin"]).query(({ ctx }) => listTendersForAuthority(ctx.user.id)),
    get: publicProcedure.input(z.number()).query(async ({ input }) => {
      const tender = await getTender(input);
      return tender && ["published", "closed", "evaluation", "awarded"].includes(tender.status) ? tender : null;
    }),
    create: roleProcedure(["authority", "admin"]).input(tenderInput).mutation(async ({ ctx, input }) => {
      if (input.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن يكون آخر أجل في المستقبل" });
      const reference = `AO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const tender = await createTender({ ...input, reference, authorityId: ctx.user.id, status: "draft", currency: "DZD" });
      await logAudit({ actorId: ctx.user.id, action: "إنشاء صفقة", entityType: "tender", entityId: tender?.id, result: "success" });
      return tender;
    }),
    update: roleProcedure(["authority", "admin"]).input(z.object({ id: z.number(), data: tenderInput.partial() })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.id);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "NOT_FOUND" });
      if (tender.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن تعديل صفقة منشورة" });
      if (input.data.deadline && input.data.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن يكون آخر أجل في المستقبل" });
      return updateTender(input.id, tender.authorityId, input.data);
    }),
    publish: roleProcedure(["authority", "admin"]).input(z.number()).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "NOT_FOUND" });
      if (tender.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "الانتقال غير مسموح من الحالة الحالية" });
      if (tender.title.trim().length < 4 || tender.description.trim().length < 12 || tender.category.trim().length < 2 || tender.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن نشر الصفقة قبل استكمال البيانات وموعد الاستقبال" });
      assertTenderTransition(tender.status, "published");
      const updated = await transitionTenderState(input, tender.authorityId, "draft", "published", { publishedAt: new Date() });
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة الصفقة قبل النشر؛ أعد المحاولة" });
      await createAuthorityOperationalAlert({ authorityId: tender.authorityId, tenderId: input, eventKey: `tender-published-${input}`, type: "tender_published", severity: "success", title: "تم نشر الصفقة", message: `نُشرت الصفقة ${tender.reference} وأصبحت متاحة للمتعاملين.` });
      await logAudit({ actorId: ctx.user.id, action: "نشر صفقة", entityType: "tender", entityId: input, result: "success" });
      return updated;
    }),
    close: roleProcedure(["authority", "admin"]).input(z.number()).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "NOT_FOUND" });
      if (tender.status !== "published") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن إغلاق الصفقة الآن" });
      assertTenderTransition(tender.status, "closed");
      const updated = await transitionTenderState(input, tender.authorityId, "published", "closed", { closedAt: new Date() });
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة الصفقة قبل الإغلاق؛ أعد المحاولة" });
      await createAuthorityOperationalAlert({ authorityId: tender.authorityId, tenderId: input, eventKey: `tender-closed-${input}`, type: "tender_closed", severity: "warning", title: "أُغلق استقبال العروض", message: `أُغلق استقبال العروض للصفقة ${tender.reference}. يمكن الآن بدء إجراءات التقييم.` });
      await logAudit({ actorId: ctx.user.id, action: "إغلاق صفقة", entityType: "tender", entityId: input, result: "success" });
      return updated;
    }),
    startEvaluation: roleProcedure(["authority", "admin"]).input(z.number()).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "NOT_FOUND" });
      if (tender.status !== "closed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يجب إغلاق الصفقة قبل التقييم" });
      assertTenderTransition(tender.status, "evaluation");
      const updated = await transitionTenderState(input, tender.authorityId, "closed", "evaluation");
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة الصفقة قبل بدء التقييم؛ أعد المحاولة" });
      await createAuthorityOperationalAlert({ authorityId: tender.authorityId, tenderId: input, eventKey: `evaluation-started-${input}`, type: "evaluation_started", severity: "info", title: "بدأ تقييم العروض", message: `انتقلت الصفقة ${tender.reference} إلى مرحلة تقييم العروض.` });
      await logAudit({ actorId: ctx.user.id, action: "بدء تقييم العروض", entityType: "tender", entityId: input, result: "success" });
      return updated;
    }),
    documents: router({
      list: publicProcedure.input(z.number()).query(async ({ input }) => {
        const tender = await getTender(input);
        if (!tender || !["published", "closed", "evaluation", "awarded"].includes(tender.status)) return [];
        return listTenderDocuments(input);
      }),
      upload: roleProcedure(["authority", "admin"]).input(z.object({ tenderId: z.number(), document: documentInput })).mutation(async ({ ctx, input }) => {
        const tender = await getTender(input.tenderId);
        if (!tender || !(await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN" });
        if (tender.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن إضافة وثائق بعد نشر الصفقة" });
        if ((await listTenderDocuments(input.tenderId)).length >= maxDocumentsPerEntity) throw new TRPCError({ code: "BAD_REQUEST", message: "تم بلوغ الحد الأقصى لعدد وثائق الصفقة" });
        const data = decodeDocument(input.document);
        const uploaded = await storagePut(`tenders/${input.tenderId}/${ctx.user.id}/${randomUUID()}-${validDocumentName(input.document.fileName)}`, data, input.document.mimeType);
        const document = await createTenderDocument({ tenderId: input.tenderId, uploadedBy: ctx.user.id, fileName: input.document.fileName, mimeType: input.document.mimeType, sizeBytes: data.length, storageKey: uploaded.key, storageUrl: uploaded.url });
        await logAudit({ actorId: ctx.user.id, action: "رفع وثيقة صفقة", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ documentId: document?.id, fileName: input.document.fileName }) });
        return stripStorageMetadata(document);
      }),
      download: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
        const document = await getTenderDocument(input);
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        const tender = await getTender(document.tenderId);
        const allowed = ctx.user.role === "admin" || ctx.user.role === "regulator" || tender?.authorityId === ctx.user.id || (ctx.user.role === "supplier" && ["published", "closed", "evaluation", "awarded"].includes(tender?.status ?? ""));
        if (!allowed) {
          await logAudit({ actorId: ctx.user.id, action: "access_denied", entityType: "tender", entityId: document.tenderId, result: "document_download_forbidden", metadata: JSON.stringify({ documentId: document.id }) });
          throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية لتنزيل هذه الوثيقة" });
        }
        const url = await storageGetSignedUrl(document.storageKey);
        await logAudit({ actorId: ctx.user.id, action: "تنزيل وثيقة صفقة", entityType: "tender", entityId: document.tenderId, result: "success", metadata: JSON.stringify({ documentId: document.id }) });
        return { ...stripStorageMetadata(document), url };
      }),
    }),
  }),
  supplier: router({
    contracts: router({
      list: roleProcedure(["supplier"]).query(({ ctx }) => listSupplierContracts(ctx.user.id)),
    }),
    alerts: router({
      list: roleProcedure(["supplier"]).input(z.object({ limit: z.number().int().min(1).max(50).default(30) }).optional()).query(async ({ ctx, input }) => {
        const items = await listSupplierOperationalAlerts(ctx.user.id, input?.limit ?? 30);
        return { items, unreadCount: items.filter(item => !item.readAt).length, refreshedAt: new Date() };
      }),
      markRead: roleProcedure(["supplier"]).input(z.object({ alertId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => markSupplierOperationalAlertsRead(ctx.user.id, input.alertId)),
      markAllRead: roleProcedure(["supplier"]).mutation(({ ctx }) => markSupplierOperationalAlertsRead(ctx.user.id)),
    }),
  }),
  authority: router({
    contracts: router({
      list: roleProcedure(["authority"]).query(({ ctx }) => listAuthorityContracts(ctx.user.id)),
      transitionStatus: roleProcedure(["authority"]).input(z.object({
        contractId: z.number().int().positive(),
        status: z.enum(["active", "completed", "suspended", "terminated"]),
      })).mutation(async ({ ctx, input }) => {
        const contract = await getAuthorityContract(input.contractId, ctx.user.id);
        if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "العقد غير موجود أو غير متاح لك" });
        const transitions = {
          pending_signature: ["active", "terminated"],
          active: ["completed", "suspended"],
          suspended: ["active", "terminated"],
          completed: [],
          terminated: [],
        } as const;
        if (!transitions[contract.status].includes(input.status as never)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "الانتقال المطلوب غير مسموح من حالة العقد الحالية" });
        }
        const updated = await updateAuthorityContractStatus(contract.id, contract.status, input.status);
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة العقد قبل الحفظ؛ أعد المحاولة" });
        const labels = { active: "نشط", completed: "مكتمل", suspended: "معلّق", terminated: "منهى" } as const;
        const severity = input.status === "active" || input.status === "completed" ? "success" : input.status === "suspended" ? "warning" : "info";
        await Promise.all([
          createAuthorityOperationalAlert({ authorityId: ctx.user.id, tenderId: contract.tenderId, eventKey: `authority-contract-status:${contract.id}:${input.status}`, type: "contract_status", severity, title: "تم تحديث حالة العقد", message: `أصبحت حالة العقد ${contract.contractReference} «${labels[input.status]}».` }),
          createSupplierOperationalAlert({ supplierId: contract.supplierId, contractId: contract.id, tenderId: contract.tenderId, eventKey: `supplier-contract-status:${contract.id}:${input.status}`, type: "contract_status", severity, title: "تحديث حالة العقد", message: `حدّثت المصلحة المتعاقدة حالة العقد ${contract.contractReference} إلى «${labels[input.status]}».` }),
          logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "authority_contract_status_updated", entityType: "supplier_contract", entityId: contract.id, result: "success", metadata: JSON.stringify({ tenderId: contract.tenderId, previousStatus: contract.status, nextStatus: input.status }) }),
        ]);
        return { ...contract, status: input.status };
      }),
    }),
    archive: router({
      list: roleProcedure(["authority"]).query(({ ctx }) => listAuthorityTenderDocuments(ctx.user.id)),
    }),
    alerts: router({
      list: roleProcedure(["authority", "admin"]).input(z.object({ limit: z.number().int().min(1).max(50).default(30) }).optional()).query(async ({ ctx, input }) => {
        const items = await listAuthorityOperationalAlerts(ctx.user.id, input?.limit ?? 30);
        return { items, unreadCount: items.filter(item => !item.readAt).length, refreshedAt: new Date() };
      }),
      markRead: roleProcedure(["authority", "admin"]).input(z.object({ alertId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => markAuthorityOperationalAlertsRead(ctx.user.id, input.alertId)),
      markAllRead: roleProcedure(["authority", "admin"]).mutation(({ ctx }) => markAuthorityOperationalAlertsRead(ctx.user.id)),
    }),
    ai: router({
      reviewTender: roleProcedure(["authority", "admin"]).input(z.number()).mutation(async ({ ctx, input }) => {
        const tender = await getTender(input);
        if (!tender || (tender.authorityId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "NOT_FOUND", message: "الصفقة غير موجودة أو لا تملك صلاحية الوصول إليها" });
        if (tender.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يتوفر التدقيق الاستشاري للمسودات فقط" });
        const audit = await buildAuthorityRfpAudit(tender);
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "authority_rfp_advisory_reviewed", entityType: "tender", entityId: tender.id, result: "success", metadata: JSON.stringify({ findingCount: audit.findings.length, llmUsed: audit.llmUsed }) });
        return audit;
      }),
    }),
  }),
  bids: router({
    mine: roleProcedure(["supplier", "admin"]).query(({ ctx }) => listBidsForSupplier(ctx.user.id)),
    forTender: roleProcedure(["authority", "admin"]).input(z.number()).query(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender || !(await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN" });
      const openingSession = await getBidOpeningSession(input);
      if (!openingSession || openingSession.status !== "sealed") {
        await logAudit({ actorId: ctx.user.id, action: "bid_opening_denied", entityType: "tender", entityId: input, result: "payload_before_opening" });
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "تبقى تفاصيل العروض محجوبة إلى حين إتمام جلسة الفتح" });
      }
      const visibleBids = await listBidsForTender(input);
      return visibleBids.filter(bid => bid.status !== "draft");
    }),
    createDraft: roleProcedure(["supplier", "admin"]).input(z.object({ tenderId: z.number() })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      if (!tender || tender.status !== "published") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "هذه الصفقة غير متاحة لإعداد عرض" });
      if (tender.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتهى أجل استقبال العروض" });
      const bid = await createBid({ tenderId: input.tenderId, supplierId: ctx.user.id, amount: 0, proposal: "", status: "draft", submittedAt: null });
      await logAudit({ actorId: ctx.user.id, action: "بدء إعداد عرض", entityType: "bid", entityId: bid?.id, result: "success", metadata: JSON.stringify({ tenderId: input.tenderId }) });
      return bid;
    }),
    updateDraft: roleProcedure(["supplier", "admin"]).input(z.object({ bidId: z.number(), amount: z.number().int().min(0), proposal: z.string().max(10000) })).mutation(async ({ ctx, input }) => {
      const bid = await getBid(input.bidId);
      if (!bid || (bid.supplierId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "NOT_FOUND" });
      if (bid.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن تعديل هذا العرض بعد إرساله" });
      const tender = await getTender(bid.tenderId);
      if (!tender || tender.status !== "published" || tender.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتهى أجل استقبال العروض أو لم تعد الصفقة متاحة" });
      const updated = await updateBid(input.bidId, { amount: input.amount, proposal: input.proposal });
      await logAudit({ actorId: ctx.user.id, action: "حفظ مسودة عرض", entityType: "bid", entityId: input.bidId, result: "success", metadata: JSON.stringify({ tenderId: bid.tenderId }) });
      return updated;
    }),
    submit: roleProcedure(["supplier", "admin"]).input(z.object({ bidId: z.number().optional(), tenderId: z.number().optional(), amount: z.number().int().positive(), proposal: z.string().min(20) }).refine(input => Boolean(input.bidId || input.tenderId), { message: "يجب تحديد العرض أو الصفقة" })).mutation(async ({ ctx, input }) => {
      const existing = input.bidId ? await getBid(input.bidId) : undefined;
      if (existing && (existing.supplierId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing && existing.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن إعادة إرسال هذا العرض" });
      const tenderId = existing?.tenderId ?? input.tenderId!;
      const tender = await getTender(tenderId);
      if (!tender || tender.status !== "published") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "هذه الصفقة غير متاحة لتقديم العروض" });
      if (tender.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتهى أجل استقبال العروض، ولا يمكن إرسال عرض جديد لهذه الصفقة" });
      let bid;
      try {
        bid = existing
          ? await updateBid(existing.id, { amount: input.amount, proposal: input.proposal, status: "submitted", submittedAt: new Date() })
          : await createBid({ tenderId, supplierId: ctx.user.id, amount: input.amount, proposal: input.proposal, status: "submitted", submittedAt: new Date() });
      } catch (error) {
        if (String(error).toLowerCase().includes("tender_supplier_unique") || String(error).toLowerCase().includes("duplicate")) {
          throw new TRPCError({ code: "CONFLICT", message: "لديك عرض قائم لهذه الصفقة؛ لا يمكن إنشاء عرض مكرر" });
        }
        throw error;
      }
      await logAudit({ actorId: ctx.user.id, action: "إرسال عرض نهائي", entityType: "bid", entityId: bid?.id, result: "success", metadata: JSON.stringify({ tenderId }) });
      return bid;
    }),
    documents: router({
      list: roleProcedure(["supplier", "authority", "admin", "regulator"]).input(z.number()).query(async ({ ctx, input }) => {
        const bid = await getBid(input);
        if (!bid) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role === "supplier" && bid.supplierId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const tender = await getTender(bid.tenderId);
        if (ctx.user.role === "authority" && tender?.authorityId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (ctx.user.role === "authority" && bid.status === "draft") throw new TRPCError({ code: "FORBIDDEN" });
        if (ctx.user.role === "authority" || ctx.user.role === "regulator") {
          const openingSession = await getBidOpeningSession(bid.tenderId);
          if (!openingSession || openingSession.status !== "sealed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "تبقى وثائق العرض محجوبة إلى حين ختم محضر جلسة الفتح" });
        }
        return listBidDocuments(input);
      }),
      upload: roleProcedure(["supplier", "admin"]).input(z.object({ bidId: z.number(), document: documentInput })).mutation(async ({ ctx, input }) => {
        const bid = await getBid(input.bidId);
        if (!bid || (bid.supplierId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        if (bid.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن إضافة وثائق بعد إرسال العرض" });
        const tender = await getTender(bid.tenderId);
        if (!tender || tender.status !== "published" || tender.deadline.getTime() <= Date.now()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "انتهى أجل استقبال العروض أو لم تعد الصفقة متاحة" });
        if ((await listBidDocuments(input.bidId)).length >= maxDocumentsPerEntity) throw new TRPCError({ code: "BAD_REQUEST", message: "تم بلوغ الحد الأقصى لعدد وثائق العرض" });
        const data = decodeDocument(input.document);
        const uploaded = await storagePut(`bids/${input.bidId}/${ctx.user.id}/${randomUUID()}-${validDocumentName(input.document.fileName)}`, data, input.document.mimeType);
        const document = await createBidDocument({ bidId: input.bidId, uploadedBy: ctx.user.id, fileName: input.document.fileName, mimeType: input.document.mimeType, sizeBytes: data.length, storageKey: uploaded.key, storageUrl: uploaded.url });
        await logAudit({ actorId: ctx.user.id, action: "رفع وثيقة عرض", entityType: "bid", entityId: input.bidId, result: "success", metadata: JSON.stringify({ documentId: document?.id, tenderId: bid.tenderId }) });
        return stripStorageMetadata(document);
      }),
      download: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
        const document = await getBidDocument(input);
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        const bid = await getBid(document.bidId);
        if (!bid) throw new TRPCError({ code: "NOT_FOUND" });
        const tender = await getTender(bid.tenderId);
        const openingSession = tender ? await getBidOpeningSession(tender.id) : undefined;
        const allowed = ctx.user.role === "admin" || (ctx.user.role === "supplier" && bid.supplierId === ctx.user.id) || (ctx.user.role === "regulator" && openingSession?.status === "sealed") || (ctx.user.role === "authority" && tender?.authorityId === ctx.user.id && bid.status !== "draft" && openingSession?.status === "sealed");
        if (!allowed) {
          await logAudit({ actorId: ctx.user.id, action: "access_denied", entityType: "bid", entityId: bid.id, result: "document_download_forbidden", metadata: JSON.stringify({ documentId: document.id }) });
          throw new TRPCError({ code: "FORBIDDEN", message: openingSession ? "لا تملك الصلاحية لتنزيل وثائق هذا العرض" : "تبقى وثائق العرض محجوبة إلى حين إتمام جلسة الفتح" });
        }
        const url = await storageGetSignedUrl(document.storageKey);
        await logAudit({ actorId: ctx.user.id, action: "تنزيل وثيقة عرض", entityType: "bid", entityId: bid.id, result: "success", metadata: JSON.stringify({ documentId: document.id }) });
        return { ...stripStorageMetadata(document), url };
      }),
    }),
    evaluate: roleProcedure(["authority", "admin"]).input(z.object({ tenderId: z.number(), bidId: z.number(), status: z.enum(["under_review", "accepted", "rejected"]), evaluationNote: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      if (!tender || !(await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN" });
      if (tender.status !== "evaluation") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن تقييم العروض قبل بدء مرحلة التقييم" });
      const bid = await getBidForTender(input.bidId, input.tenderId);
      if (!bid) throw new TRPCError({ code: "BAD_REQUEST", message: "العرض لا ينتمي إلى هذه الصفقة" });
      assertBidTransition(bid.status, input.status);
      const updatedBid = await transitionBidState(input.bidId, "under_review", input.status, { evaluationNote: input.evaluationNote, evaluatedAt: new Date() });
      if (!updatedBid) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة العرض قبل التقييم؛ أعد المحاولة" });
      await logAudit({ actorId: ctx.user.id, action: "تقييم عرض", entityType: "bid", entityId: input.bidId, result: "success", metadata: JSON.stringify({ tenderId: input.tenderId, status: input.status }) });
      return updatedBid;
    }),
  }),
  bidOpening: router({
    committee: roleProcedure(["authority", "admin"]).input(z.number()).query(async ({ ctx, input }) => {
      const tender = await getTender(input);
      const isOwnerAuthority = Boolean(tender && ctx.user.role === "authority" && tender.authorityId === ctx.user.id);
      if (!tender || !(isOwnerAuthority || await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "FORBIDDEN" });
      const members = await listOpeningCommittee(input);
      const quorum = Math.max(2, Math.ceil(members.length / 2));
      return { members, quorum, activeCount: members.length };
    }),
    appoint: roleProcedure(["authority", "admin"]).input(z.object({ tenderId: z.number().int().positive(), userId: z.number().int().positive(), role: z.enum(["chair", "member", "secretary"]) })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["published", "closed"].includes(tender.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "تُدار اللجنة بعد إنشاء الصفقة وقبل فتحها فقط" });
      const target = await getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "عضو اللجنة غير موجود" });
      const member = await appointOpeningCommitteeMember({ tenderId: input.tenderId, userId: input.userId, role: input.role, appointedBy: ctx.user.id });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_committee_member_appointed", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ userId: input.userId, role: input.role }) });
      return member;
    }),
    revoke: roleProcedure(["authority", "admin"]).input(z.object({ tenderId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      if (!tender || !(await canActOnTender(ctx.user, tender, "manage"))) throw new TRPCError({ code: "FORBIDDEN" });
      const revoked = await revokeOpeningCommitteeMember(input.tenderId, input.userId);
      if (revoked) await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_committee_member_revoked", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ userId: input.userId }) });
      return { revoked };
    }),
    eligibility: roleProcedure(["authority", "admin"]).input(z.number()).query(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender || !(await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية للوصول إلى جلسة فتح العروض" });
      const session = await getBidOpeningSession(input);
      const committee = await listOpeningCommittee(input);
      const quorum = Math.max(2, Math.ceil(committee.length / 2));
      const serverNow = new Date();
      const submittedCount = (await listBidsForTender(input)).filter(bid => bid.status === "submitted").length;
      const alreadyOpened = Boolean(session);
      const openingAvailable = !alreadyOpened && serverNow.getTime() >= tender.deadline.getTime() && submittedCount > 0;
      const status = alreadyOpened ? session?.status ?? "opened" : serverNow.getTime() < tender.deadline.getTime() ? "before_opening" : submittedCount === 0 ? "no_submitted_bids" : committee.length < quorum ? "quorum_missing" : "opening_available";
      return { tenderId: tender.id, reference: tender.reference, title: tender.title, scheduledAt: tender.deadline, serverNow, submittedCount, status, openingAvailable, alreadyOpened, quorum, committee, session };
    }),
    minutes: roleProcedure(["authority", "admin", "regulator"]).input(z.number()).query(async ({ ctx, input }) => {
      const tender = await getTender(input);
      if (!tender) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwnerAuthority = ctx.user.role === "authority" && tender.authorityId === ctx.user.id;
      const isCommitteeMember = ctx.user.role === "authority" && Boolean(await getActiveOpeningCommitteeMember(input, ctx.user.id));
      if (!(isOwnerAuthority || isCommitteeMember || ctx.user.role === "admin" || ctx.user.role === "regulator")) throw new TRPCError({ code: "FORBIDDEN" });
      const session = await getBidOpeningSession(input);
      if (!session || session.status !== "sealed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "المحضر غير متاح قبل ختم جلسة الفتح" });
      const minutes = await getBidOpeningMinutes(input);
      if (!minutes) throw new TRPCError({ code: "NOT_FOUND", message: "محضر الفتح غير موجود" });
      const signatures = await listOpeningMinutesSignatures(input);
      const events = await listAuditLogsForTender(input);
      return { ...minutes, content: JSON.parse(minutes.content) as Record<string, unknown>, signatures, events };
    }),
    sign: protectedProcedure.input(z.object({ tenderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "authority") throw new TRPCError({ code: "FORBIDDEN", message: "التوقيع محصور بأعضاء لجنة الفتح من الجهة المتعاقدة" });
      const tender = await getTender(input.tenderId);
      if (!tender || tender.authorityId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية توقيع هذا المحضر" });
      const session = await getBidOpeningSession(input.tenderId);
      if (!session || session.status !== "sealed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن توقيع المحضر قبل ختم جلسة الفتح" });
      const member = await getActiveOpeningCommitteeMember(input.tenderId, ctx.user.id);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "يجب أن تكون عضواً فعلياً في لجنة الفتح" });
      try {
        const result = await signOpeningMinutes(input.tenderId, ctx.user.id);
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_minutes_signed", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ signatureId: result.signature?.id, signatureAlgorithm: result.signature?.signatureAlgorithm, approved: result.approved }) });
        if (result.approved) await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_minutes_approved", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ signatureCount: result.signatures.length }) });
        return result;
      } catch (error) {
        if (String(error).includes("Opening committee membership")) throw new TRPCError({ code: "FORBIDDEN", message: "يجب أن تكون عضواً فعلياً في لجنة الفتح" });
        throw error;
      }
    }),
    open: protectedProcedure.input(z.object({ tenderId: z.number().int().positive(), committeeMemberIds: z.array(z.number().int().positive()).min(1) })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      const isOwnerAuthority = Boolean(tender && ctx.user.role === "authority" && tender.authorityId === ctx.user.id);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "bid_opening_attempted", entityType: "tender", entityId: input.tenderId, result: tender ? "received" : "not_found" });
      if (!tender || !(isOwnerAuthority || await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك الصلاحية لفتح العروض" });
      const serverNow = new Date();
      if (serverNow.getTime() < tender.deadline.getTime()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لم يحل موعد فتح العروض بعد. يعتمد النظام على وقت الخادم." });
      if (!["published", "closed"].includes(tender.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن فتح عروض هذه الصفقة في حالتها الحالية" });
      const committee = await listOpeningCommittee(input.tenderId);
      const activeIds = new Set(committee.map(member => member.userId));
      const selectedIds = Array.from(new Set(input.committeeMemberIds)).filter(id => activeIds.has(id));
      const quorum = Math.max(2, Math.ceil(committee.length / 2));
      if (!activeIds.has(ctx.user.id) || selectedIds.length < quorum) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن فتح الأظرفة دون حضور عضو لجنة مفوض وتحقيق النصاب" });
      try {
        const opened = await openTenderBids(input.tenderId, ctx.user.id, tender.deadline, selectedIds, quorum);
        if (opened.alreadyOpened) return { session: opened.session, minutes: await getBidOpeningMinutes(input.tenderId), alreadyOpened: true };
        if (tender.status === "published") await transitionTenderState(input.tenderId, tender.authorityId, "published", "closed", { closedAt: serverNow });
        const minutes = await getBidOpeningMinutes(input.tenderId);
        if (!minutes) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء محضر الفتح" });
        const parsed = JSON.parse(minutes.content) as { openedBids?: Array<{ bidId: number }> };
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "bid_opened", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ submittedCount: opened.session.submittedCount, openedAt: opened.session.openedAt?.toISOString() ?? serverNow.toISOString() }) });
        for (const bid of parsed.openedBids ?? []) await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "bid_opened", entityType: "bid", entityId: bid.bidId, result: "success", metadata: JSON.stringify({ tenderId: input.tenderId }) });
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_minutes_generated", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ sessionId: opened.session.id }) });
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opening_minutes_sealed", entityType: "tender", entityId: input.tenderId, result: "success", metadata: JSON.stringify({ sessionId: opened.session.id, digest: minutes.contentDigest }) });
        return { session: opened.session, minutes: { ...minutes, content: parsed }, alreadyOpened: false };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("opening quorum")) throw new TRPCError({ code: "CONFLICT", message: "تغيرت جلسة الفتح أو لم يتحقق النصاب؛ أعد المحاولة" });
        throw error;
      }
    }),
  }),
  awards: router({
    decide: roleProcedure(["authority", "admin"]).input(z.object({ tenderId: z.number(), winningBidId: z.number().optional(), decision: z.enum(["awarded", "cancelled"]), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const tender = await getTender(input.tenderId);
      if (!tender || !(await canActOnTender(ctx.user, tender, "decide"))) throw new TRPCError({ code: "FORBIDDEN" });
      if (tender.status !== "evaluation") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يجب أن تكون الصفقة قيد التقييم" });
      if (input.decision === "awarded" && !input.winningBidId) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب تحديد العرض الفائز" });
      let winningBid: Awaited<ReturnType<typeof getBid>> | undefined;
      if (input.decision === "awarded") {
        const tenderBids = await listBidsForTender(input.tenderId);
        winningBid = tenderBids.find(candidate => candidate.id === input.winningBidId);
        if (!winningBid) throw new TRPCError({ code: "BAD_REQUEST", message: "العرض الفائز لا ينتمي إلى هذه الصفقة" });
        if (winningBid.status !== "accepted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يجب اعتماد العرض قبل إسناد الصفقة" });
      }
      const contractReference = winningBid ? `CTR-${tender.reference}` : undefined;
      const decision = await decideAwardAtomically({ tenderId: input.tenderId, winningBidId: input.winningBidId, decision: input.decision, notes: input.notes, decidedBy: ctx.user.id }, tender.authorityId, input.decision === "awarded" ? "awarded" : "cancelled", winningBid && contractReference ? {
        supplierId: winningBid.supplierId,
        winningBidId: winningBid.id,
        contractReference,
        amount: winningBid.amount,
        currency: tender.currency,
        alertTitle: "إسناد صفقة جديد",
        alertMessage: `تم إسناد الصفقة ${tender.reference} إلى عرضك. سجل العقد ${contractReference} في انتظار استكمال التوقيع.`,
      } : undefined);
      if (!decision) throw new TRPCError({ code: "CONFLICT", message: "تغيرت حالة الصفقة أو صدر قرار سابق؛ أعد تحميل الصفحة" });
      await logAudit({ actorId: ctx.user.id, action: input.decision === "awarded" ? "إسناد الصفقة" : "إلغاء الصفقة", entityType: "tender", entityId: input.tenderId, result: "success" });
      return decision;
    }),
  }),
  adminDelegation: router({
    list: roleProcedure(["admin"]).query(({ ctx }) => listAdminDelegations(ctx.user.id)),
    create: roleProcedure(["admin"]).input(z.object({ delegateAdminId: z.number().int().positive(), authorityUserId: z.number().int().positive(), scope: z.enum(["manage", "decide"]), reason: z.string().min(10).max(500), startsAt: z.date(), expiresAt: z.date() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "إنشاء التفويض محصور بالمسؤول النظامي" });
      const delegate = await getUserById(input.delegateAdminId);
      const authority = await getUserById(input.authorityUserId);
      if (!delegate || delegate.role !== "admin" || !authority || authority.role !== "authority") throw new TRPCError({ code: "BAD_REQUEST", message: "يجب اختيار مسؤول إداري ومصلحة متعاقدة معتمدة" });
      if (input.expiresAt <= input.startsAt || input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "مدة التفويض غير صالحة" });
      const delegation = await createAdminDelegation({ adminUserId: input.delegateAdminId, authorityUserId: input.authorityUserId, scope: input.scope, reason: input.reason, startsAt: input.startsAt, expiresAt: input.expiresAt });
      await logAudit({ actorId: ctx.user.id, action: "admin_delegation_created", entityType: "admin_delegation", entityId: delegation.id, result: "success", metadata: JSON.stringify({ delegateAdminId: input.delegateAdminId, authorityUserId: input.authorityUserId, scope: input.scope, expiresAt: input.expiresAt.toISOString() }) });
      return delegation;
    }),
    revoke: roleProcedure(["admin"]).input(z.number().int().positive()).mutation(async ({ ctx, input }) => {
      if (ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "إلغاء التفويض محصور بالمسؤول النظامي" });
      const revoked = await revokeAdminDelegation(input, ctx.user.id);
      if (!revoked) throw new TRPCError({ code: "NOT_FOUND", message: "التفويض غير موجود أو ملغى سابقاً" });
      await logAudit({ actorId: ctx.user.id, action: "admin_delegation_revoked", entityType: "admin_delegation", entityId: input, result: "success" });
      return { revoked: true };
    }),
  }),
  regulator: router({
    stats: roleProcedure(["regulator", "admin"]).query(() => getPlatformStats()),
    overview: roleProcedure(["regulator", "admin"]).query(() => getRegulatorOverview()),
    audit: roleProcedure(["regulator", "admin"]).query(() => listAuditLogs()),
    tenders: roleProcedure(["regulator", "admin"]).query(() => listAllTenders()),
    authorities: roleProcedure(["regulator", "admin"]).query(() => listCentralAuthorityRegistry()),
    operators: roleProcedure(["regulator", "admin"]).query(() => listCentralOperatorRegistry()),
    approveAuthority: roleProcedure(["regulator", "admin"]).input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.userId);
      const requested = target?.role === "user" && await hasAuthorityApprovalRequest(input.userId);
      if (!target || target.role !== "user" || !requested) {
        await logAudit({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "authority_role_approval_denied",
          entityType: "user",
          entityId: input.userId,
          result: "denied",
          metadata: JSON.stringify({ reason: !target ? "user_not_found" : target.role !== "user" ? "role_already_assigned" : "authority_role_not_requested" }),
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن اعتماد هذا الحساب كمصلحة متعاقدة" });
      }
      await upsertUser({ openId: target.openId, role: "authority" });
      await createAuthorityOperationalAlert({ authorityId: input.userId, eventKey: `authority-approved-${input.userId}`, type: "authority_approved", severity: "success", title: "تم اعتماد المصلحة المتعاقدة", message: "تم اعتماد حساب المصلحة من الإدارة المركزية. يمكنك الآن استخدام مسارات العمل المحمية." });
      await logAudit({
        actorId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "authority_role_approved",
        entityType: "user",
        entityId: input.userId,
        result: "success",
        metadata: JSON.stringify({ assignedRole: "authority" }),
      });
      return { success: true, role: "authority" as const };
    }),
    rejectAuthority: roleProcedure(["regulator", "admin"]).input(z.object({ userId: z.number().int().positive(), reason: z.string().trim().min(10).max(500) })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.userId);
      const requested = target?.role === "user" && await hasAuthorityApprovalRequest(input.userId);
      if (!target || target.role !== "user" || !requested) {
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "authority_role_rejection_denied", entityType: "user", entityId: input.userId, result: "denied", metadata: JSON.stringify({ reason: !target ? "user_not_found" : target.role !== "user" ? "role_already_assigned" : "authority_role_not_requested" }) });
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن رفض هذا الطلب في حالته الحالية" });
      }
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "authority_role_rejected", entityType: "user", entityId: input.userId, result: "rejected", metadata: JSON.stringify({ reason: input.reason }) });
      return { success: true, status: "rejected" as const };
    }),
    ai: router({
      insights: roleProcedure(["regulator", "admin"]).input(z.object({ tenderId: z.number().int().positive() })).query(async ({ ctx, input }) => {
        const tender = await getTender(input.tenderId);
        if (!tender) throw new TRPCError({ code: "NOT_FOUND", message: "الصفقة غير موجودة" });
        const openingSession = await getBidOpeningSession(tender.id);
        const bids = await listBidsForTender(tender.id);
        const profiles = await listProfilesByUserIds(Array.from(new Set(bids.map(bid => bid.supplierId))));
        const profilesByUserId = new Map(profiles.map(profile => [profile.userId, profile]));
        const result = buildRegulatorAiResult(tender, bids, profilesByUserId, Boolean(openingSession));
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "regulator_ai_insights_viewed", entityType: "tender", entityId: tender.id, result: "success", metadata: JSON.stringify({ insightCount: result.insights.length, openingAvailable: result.openingAvailable }) });
        return result;
      }),
      radar: roleProcedure(["regulator", "admin"]).query(async ({ ctx }) => {
        const tenders = await listAllTenders();
        const allBids = await listAllBids();
        const profiles = await listProfilesByUserIds(Array.from(new Set(allBids.map(bid => bid.supplierId))));
        const profilesByUserId = new Map(profiles.map(profile => [profile.userId, profile]));
        const radar = [];
        for (const tender of tenders.slice(0, 30)) {
          const openingSession = await getBidOpeningSession(tender.id);
          const bids = allBids.filter(bid => bid.tenderId === tender.id);
          const result = buildRegulatorAiResult(tender, bids, profilesByUserId, Boolean(openingSession));
          if (result.insights.length) radar.push({ tenderId: result.tenderId, tenderReference: result.tenderReference, tenderTitle: result.tenderTitle, insightCount: result.insights.length, highestSeverity: result.insights.some(insight => insight.severity === "high") ? "high" : result.insights.some(insight => insight.severity === "medium") ? "medium" : "low", kinds: result.insights.map(insight => insight.kind) });
        }
        await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "regulator_ai_radar_viewed", entityType: "platform", result: "success", metadata: JSON.stringify({ tenderCount: radar.length }) });
        return radar;
      }),
    }),
  }),
  smartDocuments: router({
    list: roleProcedure(["supplier", "authority"]).input(z.object({ audience: z.enum(["supplier", "authority"]).optional() }).optional()).query(async ({ ctx, input }) => {
      const audience = input?.audience ?? (ctx.user.role === "supplier" ? "supplier" : "authority");
      if (audience !== ctx.user.role) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن الوصول إلى سجلات دور آخر" });
      return listSmartTenderDocumentsForOwner(ctx.user.id, audience);
    }),
    get: roleProcedure(["supplier", "authority"]).input(z.object({ documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const document = await getSmartTenderDocumentForOwner(input.documentId, ctx.user.id);
      if (!document || document.audience !== ctx.user.role) throw new TRPCError({ code: "NOT_FOUND", message: "دفتر الشروط غير موجود" });
      const [versions, reviews] = await Promise.all([listSmartTenderDocumentVersions(document.id), listSmartTenderDocumentReviews(document.id)]);
      return { document, versions, reviews };
    }),
    create: roleProcedure(["supplier", "authority"]).input(z.object({ title: z.string().trim().min(2).max(255), tenderId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      const audience = ctx.user.role === "supplier" ? "supplier" : "authority";
      const document = await createSmartTenderDocument({ ownerId: ctx.user.id, authorityId: audience === "authority" ? ctx.user.id : null, tenderId: input.tenderId, audience, title: input.title, status: "draft", completion: 0, currentVersionNumber: 1 });
      if (!document) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء دفتر الشروط" });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "smart_tender_document_created", entityType: "smart_tender_document", entityId: document.id, result: "success", metadata: JSON.stringify({ audience, tenderId: input.tenderId ?? null }) });
      return document;
    }),
    saveVersion: roleProcedure(["supplier", "authority"]).input(z.object({ documentId: z.number().int().positive(), fields: z.record(z.string().max(120), z.string().max(4000)).refine(value => Object.keys(value).length <= 80), source: z.enum(["human", "ai_assisted"]).default("human") })).mutation(async ({ ctx, input }) => {
      const document = await getSmartTenderDocumentForOwner(input.documentId, ctx.user.id);
      if (!document || document.audience !== ctx.user.role) throw new TRPCError({ code: "NOT_FOUND", message: "دفتر الشروط غير موجود" });
      const versions = await listSmartTenderDocumentVersions(document.id);
      const contentJson = JSON.stringify({ fields: input.fields, savedAt: new Date().toISOString() });
      const contentDigest = createHash("sha256").update(contentJson, "utf8").digest("hex");
      const version = await createSmartTenderDocumentVersion({ documentId: document.id, versionNumber: (versions[0]?.versionNumber ?? 0) + 1, contentJson, contentDigest, createdBy: ctx.user.id, source: input.source });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "smart_tender_document_version_saved", entityType: "smart_tender_document", entityId: document.id, result: "success", metadata: JSON.stringify({ versionNumber: version?.versionNumber ?? null, source: input.source, fieldCount: Object.keys(input.fields).length }) });
      return version;
    }),
    requestAssistance: roleProcedure(["supplier", "authority"]).input(z.object({ documentId: z.number().int().positive(), task: z.string().trim().min(2).max(2000), fields: z.record(z.string().max(120), z.unknown()).default({}) })).mutation(async ({ ctx, input }) => {
      const document = await getSmartTenderDocumentForOwner(input.documentId, ctx.user.id);
      if (!document || document.audience !== ctx.user.role) throw new TRPCError({ code: "NOT_FOUND", message: "دفتر الشروط غير موجود" });
      const audience = ctx.user.role === "supplier" ? "supplier" : "authority";
      const subscription = await ensureFreeSubscription(ctx.user.id, audience);
      if (!subscription) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "تعذر تهيئة اشتراك الحساب" });
      const featureCode = "document_preparation_assistance";
      const snapshot = (await getEntitlementSnapshot(subscription.id)).find(item => item.featureCode === featureCode);
      const usage = await getUsage(ctx.user.id, featureCode, subscription.currentPeriodStart);
      const entitlement = resolveEntitlement(featureCode, subscription, snapshot, usage?.units ?? 0);
      if (!entitlement.allowed) {
        await logAiAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, featureCode, action: "smart_document_assistance_denied", entityType: "smart_tender_document", entityId: document.id, policyDecision: entitlement.reason, result: "denied", metadata: JSON.stringify({ remaining: entitlement.remaining }) });
        throw new TRPCError({ code: entitlement.reason === "quota_exhausted" ? "TOO_MANY_REQUESTS" : "FORBIDDEN", message: "تحتاج هذه المساعدة إلى امتياز مدفوع أو حصة متاحة" });
      }
      if (snapshot?.entitlementType === "quota") {
        const reserved = await reserveFeatureUsage(ctx.user.id, featureCode, subscription.currentPeriodStart, subscription.currentPeriodEnd, snapshot.quotaLimit ?? 0);
        if (!reserved) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم استنفاد حصة المساعدة لهذه الفترة" });
      }
      let gatewayResult;
      try { gatewayResult = await runAiGateway(ctx.user, { featureCode, task: input.task, fields: input.fields, entityType: "smart_tender_document", entityId: document.id }); }
      catch (error) {
        await logAiAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, featureCode, action: "smart_document_assistance_blocked", entityType: "smart_tender_document", entityId: document.id, policyDecision: "blocked", result: "rejected", metadata: JSON.stringify({ reason: error instanceof Error ? error.message : "policy_error" }) });
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر قبول الطلب وفق سياسة البوابة" });
      }
      await logAiAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, featureCode, action: "smart_document_assistance_requested", entityType: "smart_tender_document", entityId: document.id, policyDecision: "allowed", result: "success", modelUsed: gatewayResult.modelUsed ? 1 : 0, inputDigest: gatewayResult.inputDigest, outputDigest: gatewayResult.outputDigest, requestId: randomUUID(), metadata: JSON.stringify({ advisoryOnly: true, gatewayVersion: gatewayResult.policy.version }) });
      return { ...gatewayResult, remaining: snapshot?.entitlementType === "quota" ? Math.max(0, (snapshot.quotaLimit ?? 0) - (usage?.units ?? 0) - 1) : entitlement.remaining };
    }),
    submitForReview: roleProcedure(["supplier", "authority"]).input(z.object({ documentId: z.number().int().positive(), versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const document = await getSmartTenderDocumentForOwner(input.documentId, ctx.user.id);
      if (!document || document.audience !== ctx.user.role) throw new TRPCError({ code: "NOT_FOUND", message: "دفتر الشروط غير موجود" });
      const review = await createSmartTenderDocumentReview({ documentId: document.id, versionId: input.versionId, reviewerId: ctx.user.id, decision: "pending", notes: null });
      await updateSmartTenderDocumentStatus(document.id, ctx.user.id, "in_review");
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "smart_tender_document_submitted_for_review", entityType: "smart_tender_document", entityId: document.id, result: "success", metadata: JSON.stringify({ versionId: input.versionId }) });
      return review;
    }),
  }),
  assistant: router({
    createThread: protectedProcedure.input(z.object({
      profileId: z.number().int().positive(),
      tenantId: z.string().max(120).optional(),
      organizationId: z.number().int().positive().optional(),
      roleCode: z.string().max(40),
      contextType: z.enum(["tender", "specification", "bid", "evaluation", "help_center"]),
      contextObjectId: z.number().int().positive().optional(),
      title: z.string().min(1).max(255),
    })).mutation(async ({ ctx, input }) => createAssistantThread({ ...input, userId: ctx.user.id })),
    listThreads: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(30) })).query(({ ctx, input }) => listAssistantThreadsForUser(ctx.user.id, input.limit)),
    submitFeedback: protectedProcedure.input(z.object({
      threadId: z.number().int().positive(),
      messageId: z.number().int().positive(),
      rating: z.enum(["useful", "not_useful"]),
      note: z.string().max(2_000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const thread = await getAssistantThreadForUser(input.threadId, ctx.user.id);
      if (!thread) throw new TRPCError({ code: "NOT_FOUND", message: "خيط المساعد غير موجود" });
      return addAssistantFeedback({ ...input, userId: ctx.user.id });
    }),
    ask: protectedProcedure.input(z.object({
      message: z.string().min(2).max(2_000).optional(),
      taskDescription: z.string().min(2).max(2_000).optional(),
      answers: z.record(z.string(), z.unknown()).default({}),
      context: z.string().max(120).default("dashboard"),
    }).refine(input => Boolean(input.message?.trim() || input.taskDescription?.trim()), { message: "يجب تقديم وصف للمهمة" })).mutation(async ({ ctx, input }) => {
      const taskDescription = input.taskDescription?.trim() || input.message!.trim();
      const audience = ctx.user.role === "supplier" || ctx.user.role === "authority" ? ctx.user.role : null;
      let remaining: number | null = null;
      if (audience) {
        const subscription = await ensureFreeSubscription(ctx.user.id, audience);
        if (!subscription) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "تعذر تهيئة اشتراك الحساب" });
        const snapshot = (await getEntitlementSnapshot(subscription.id)).find(item => item.featureCode === "ai_rfp_generation");
        const usage = await getUsage(ctx.user.id, "ai_rfp_generation", subscription!.currentPeriodStart);
        const entitlement = resolveEntitlement("ai_rfp_generation", subscription, snapshot, usage?.units ?? 0);
        if (!entitlement.allowed) {
          await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "assistant_advisory_denied", entityType: "platform", result: entitlement.reason, metadata: JSON.stringify({ featureCode: "ai_rfp_generation", remaining: entitlement.remaining }) });
          throw new TRPCError({ code: entitlement.reason === "quota_exhausted" ? "TOO_MANY_REQUESTS" : "FORBIDDEN", message: entitlement.reason === "quota_exhausted" ? "تم استنفاد حصة المساعد لهذه الفترة" : "لا تملك هذه الخطة امتياز المساعد" });
        }
        if (snapshot?.entitlementType === "quota") {
          const reserved = await reserveFeatureUsage(ctx.user.id, "ai_rfp_generation", subscription.currentPeriodStart, subscription.currentPeriodEnd, snapshot.quotaLimit ?? 0);
          if (!reserved) {
            await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "assistant_advisory_denied", entityType: "platform", result: "quota_race_or_exhausted", metadata: JSON.stringify({ featureCode: "ai_rfp_generation" }) });
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم استنفاد حصة المساعد لهذه الفترة" });
          }
          remaining = Math.max(0, (snapshot.quotaLimit ?? 0) - (usage?.units ?? 0) - 1);
        } else {
          remaining = entitlement.remaining;
        }
      }
      const prepared = prepareAdvisoryRequest({ user: { id: ctx.user.id, role: ctx.user.role }, task: taskDescription, fields: { ...input.answers, context: input.context, role: ctx.user.role }, entityType: "smart_tender_document", action: "suggest" });
      const result = await generateSmartPromptResult(taskDescription, prepared.context.fields);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "assistant_advisory_requested", entityType: "platform", result: "success", metadata: JSON.stringify({ modelUsed: result.modelUsed, advisoryOnly: result.advisoryOnly, remaining }) });
      return { ...result, remaining, intent: prepared.intent, policyVersion: prepared.policy.version, requiresHumanReview: prepared.action.requiresHumanReview };
    }),
  }),
});

export type AppRouter = typeof appRouter;
