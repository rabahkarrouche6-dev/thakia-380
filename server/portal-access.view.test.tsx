// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Portal from "../client/src/pages/Portal";

const { authState, layoutState } = vi.hoisted(() => ({
  authState: { current: { loading: false, user: null } as any },
  layoutState: { latestProps: null as any },
}));
const trpcState = vi.hoisted(() => ({
  activateSupplier: vi.fn(),
  requestAuthorityApproval: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authState.current,
}));
vi.mock("@/contexts/LocaleContext", () => ({
  useLocale: () => ({ locale: "ar", direction: "rtl", isEnglish: false }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    auth: {
      setRole: { useMutation: () => ({ mutate: trpcState.activateSupplier, isPending: false, isSuccess: false }) },
      requestAuthorityApproval: { useMutation: () => ({ mutate: trpcState.requestAuthorityApproval, isPending: false, isSuccess: false }) },
    },
  },
}));
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children, ...props }: any) => {
    layoutState.latestProps = props;
    return <div data-testid="workspace-shell">{children}</div>;
  },
}));
vi.mock("@/pages/AuthorityShell", () => ({
  default: () => <div>بوابة المصلحة</div>,
  getAuthorityNavItems: () => Array.from({ length: 10 }, (_, index) => ({ label: `قسم ${index + 1}`, path: `/app?section=${index + 1}` })),
}));
vi.mock("@/pages/SupplierWorkspace", () => ({
  default: () => <div>بوابة المورد</div>,
  supplierNavItems: [],
}));
vi.mock("@/pages/CentralAdminPortal", () => ({
  default: () => <div>بوابة الإدارة</div>,
}));
vi.mock("@/components/AIChatBox", () => ({
  AIChatBox: () => null,
}));

describe("Portal workspace access contract", () => {
  afterEach(() => {
    cleanup();
    authState.current = { loading: false, user: null };
    layoutState.latestProps = null;
    trpcState.activateSupplier.mockReset();
    trpcState.requestAuthorityApproval.mockReset();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("shows the explicit denial card and does not supply navigation for an unapproved role", () => {
    authState.current = { loading: false, user: { id: 7, name: "Guest", role: "guest" } };
    render(<Portal />);

    expect(screen.getByText("الوصول إلى مساحة العمل غير متاح")).toBeTruthy();
    expect(screen.getByText(/لا يرتبط حسابك بدور مساحة عمل معتمد/)).toBeTruthy();
    expect(layoutState.latestProps.title).toBe("التحكم في الوصول");
    expect(layoutState.latestProps.items).toBeUndefined();
    expect(screen.queryByText("بوابة المصلحة")).toBeNull();
  });

  it("supplies the ten authority destinations only for an approved authority role", async () => {
    authState.current = { loading: false, user: { id: 8, name: "Authority", role: "authority" } };
    render(<Portal />);

    await waitFor(() => expect(screen.getByText("بوابة المصلحة")).toBeTruthy());
    expect(layoutState.latestProps.title).toBe("مساحة المصلحة المتعاقدة");
    expect(layoutState.latestProps.items).toHaveLength(10);
  });

  it("activates a verified supplier selection after OAuth without exposing a self-service authority assignment", async () => {
    authState.current = { loading: false, user: { id: 12, name: "Supplier", role: "user" }, refresh: vi.fn() };
    window.sessionStorage.setItem("safaqat-login-portal", "supplier");
    render(<Portal />);

    await waitFor(() => expect(trpcState.activateSupplier).toHaveBeenCalledWith("supplier"));
    expect(trpcState.requestAuthorityApproval).not.toHaveBeenCalled();
  });

  it("restores the supplier selection from local storage when OAuth returns in a different tab", async () => {
    authState.current = { loading: false, user: { id: 13, name: "Supplier", role: "user" }, refresh: vi.fn() };
    window.localStorage.setItem("safaqat-login-portal-fallback", "supplier");
    render(<Portal />);

    await waitFor(() => expect(trpcState.activateSupplier).toHaveBeenCalledWith("supplier"));
    expect(window.localStorage.getItem("safaqat-login-portal-fallback")).toBeNull();
    expect(trpcState.requestAuthorityApproval).not.toHaveBeenCalled();
  });
});
