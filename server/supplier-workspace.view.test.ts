import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("supplier workspace view contract", () => {
  const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/Portal.tsx"), "utf8");
  const navigationSource = readFileSync(resolve(process.cwd(), "client/src/lib/portalNavigation.ts"), "utf8");
  const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/pages/SupplierWorkspace.tsx"), "utf8");
  const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

  it("routes supplier users to the dedicated workspace and navigation", () => {
    expect(portalSource).toContain('const SupplierWorkspace = lazy(() => import("@/pages/SupplierWorkspace"))');
    expect(portalSource).toContain("isSupplier ? <SupplierWorkspace />");
    expect(portalSource).toContain("const items = isSupplier ? supplierNavItems");
    expect(navigationSource).toContain("supplierNavItems");
    expect(workspaceSource).toContain("الملف المؤسسي");
    expect(workspaceSource).toContain("الصفقات المنشورة");
    expect(workspaceSource).toContain("عروضي");
    expect(workspaceSource).toContain("الملف الشخصي للمستخدم");
    expect(workspaceSource).toContain("اسم المتعامل");
    expect(workspaceSource).toContain("الشكل القانوني");
    expect(workspaceSource).toContain('onNavigate("profile")');
  });

  it("reads the active supplier section from the URL search string", () => {
    expect(workspaceSource).toContain('import { useLocation, useSearch } from "wouter"');
    expect(workspaceSource).toContain("const search = useSearch()");
    expect(workspaceSource).toContain('new URLSearchParams(search).get("section")');
    expect(workspaceSource).not.toContain('location.split("?")[1]');
    expect(workspaceSource).toContain("setLocation(`/app?section=${next}`)");
  });

  it("uses only the existing supplier data contracts", () => {
    expect(workspaceSource).toContain("trpc.profile.get.useQuery()");
    expect(workspaceSource).toContain("trpc.operator.get.useQuery()");
    expect(workspaceSource).toContain("operator.data?.legalName");
    expect(workspaceSource).toContain("trpc.profile.save.useMutation");
    expect(workspaceSource).toContain("trpc.tenders.published.useQuery()");
    expect(workspaceSource).toContain("trpc.bids.mine.useQuery()");
    expect(workspaceSource).toContain("trpc.bids.createDraft.useMutation");
    expect(workspaceSource).toContain("trpc.bids.updateDraft.useMutation");
    expect(workspaceSource).toContain("trpc.bids.documents.upload.useMutation");
    expect(workspaceSource).toContain("trpc.bids.submit.useMutation");
    expect(workspaceSource).toContain("trpc.tenders.documents.list.useQuery");
    expect(workspaceSource).not.toContain("eligibility");
    expect(workspaceSource).not.toContain("eligibility");
    expect(workspaceSource).not.toContain("testimonials");
  });

  it("preserves server-side supplier access and submission guards", () => {
    expect(routerSource).toContain('mine: roleProcedure(["supplier", "admin"])');
    expect(routerSource).toContain('submit: roleProcedure(["supplier", "admin"])');
    expect(routerSource).toContain('tender.status !== "published"');
    expect(routerSource).toContain("انتهى أجل استقبال العروض، ولا يمكن إرسال عرض جديد لهذه الصفقة");
    expect(routerSource).toContain("supplierId: ctx.user.id");
    expect(workspaceSource).toContain("يوجد عرض مرسل لهذه الصفقة");
    expect(workspaceSource).toContain("لا يمكن تعديله بعد الإرسال");
    expect(workspaceSource).toContain("هذا التحقق مطبق على الخادم أيضاً");
  });

  it("declares loading, error, empty, and retry paths", () => {
    expect(workspaceSource).toContain("tenders.isLoading || bids.isLoading");
    expect(workspaceSource).toContain("tenders.isError || bids.isError");
    expect(workspaceSource).toContain("لا توجد صفقات منشورة حالياً");
    expect(workspaceSource).toContain("انتهى أجل استقبال العروض");
    expect(workspaceSource).toContain("لم تُودع عروض بعد");
    expect(workspaceSource).toContain("إعادة المحاولة");
  });

  it("handles a missing supplier profile without treating it as a transport error", () => {
    expect(routerSource).toContain("(await getProfile(ctx.user.id)) ?? null");
    expect(routerSource).toContain("(await getOperatorProfile(ctx.user.id)) ?? null");
    expect(workspaceSource).toContain("الملف غير مكتمل بعد");
    expect(workspaceSource).toContain("إنشاء الملف المؤسسي الأولي");
    expect(workspaceSource).toContain("current?.legalName || form.organizationName.trim()");
    expect(workspaceSource).toContain("form.organizationName.trim().length < 2");
  });

  it("filters and sorts published tenders using real tender fields", () => {
    expect(workspaceSource).toContain("searchTerm");
    expect(workspaceSource).toContain("categoryFilter");
    expect(workspaceSource).toContain("sortBy");
    expect(workspaceSource).toContain("tender.category");
    expect(workspaceSource).toContain("tender.deadline");
    expect(workspaceSource).toContain("tender.budget");
    expect(workspaceSource).toContain("لا توجد نتائج مطابقة");
    expect(workspaceSource).toContain("aria-live=\"polite\"");
    expect(workspaceSource).not.toContain("statusFilter");
  });

  it("keeps filter controls keyboard and mobile accessible", () => {
    expect(workspaceSource).toContain('aria-label="البحث في الصفقات"');
    expect(workspaceSource).toContain('aria-label="تصفية حسب التصنيف"');
    expect(workspaceSource).toContain('aria-label="ترتيب الصفقات"');
    expect(workspaceSource).toContain("focus-visible:ring-2");
    expect(workspaceSource).toContain("md:grid-cols-[1.5fr_1fr_1fr]");
  });

  it("presents supplier work with visible filter state, semantic statuses, and document states", () => {
    expect(workspaceSource).toContain("إزالة التصفية");
    expect(workspaceSource).toContain("التصفية النشطة:");
    expect(workspaceSource).toContain("مراجعة التفاصيل والتقديم");
    expect(workspaceSource).toContain("وثائق الصفقة المتاحة");
    expect(workspaceSource).toContain("في انتظار الحفظ");
    expect(workspaceSource).toContain("محفوظة");
    expect(workspaceSource).toContain("يتطلب الانتباه");
    expect(workspaceSource).toContain("CircleDot");
    expect(workspaceSource).not.toContain("createMock");
  });
});
