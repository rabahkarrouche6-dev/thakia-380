// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import DashboardLayout from "../client/src/components/DashboardLayout";

const { authState } = vi.hoisted(() => ({
  authState: { current: { loading: false, user: null } as any },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authState.current,
}));
vi.mock("@/contexts/LocaleContext", () => ({
  useLocale: () => ({ direction: "rtl", isEnglish: false }),
}));
vi.mock("wouter", () => ({
  useLocation: () => ["/app", vi.fn()],
  useSearch: () => "",
}));

describe("DashboardLayout access gate", () => {
  afterEach(() => {
    cleanup();
    authState.current = { loading: false, user: null };
  });

  it("shows the sign-in gate and does not render workspace navigation without a session", () => {
    render(<DashboardLayout title="مساحة المصلحة المتعاقدة"><div>محتوى محمي</div></DashboardLayout>);

    expect(screen.getByRole("heading").textContent).toContain("الدخول مطلوب");
    expect(screen.getByRole("link").textContent).toContain("استكشاف المعاينة");
    expect(screen.queryByText("محتوى محمي")).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
  });
});
