// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import LoginRedirect from "../client/src/pages/LoginRedirect";

vi.mock("wouter", () => ({
  useLocation: () => ["/login/authority", vi.fn()],
}));

describe("Login redirect interaction", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("stores the selected portal and redirects to preview without rendering the removed page", () => {
    render(<LoginRedirect />);

    expect(window.sessionStorage.getItem("safaqat-login-portal")).toBe("authority");
    expect(screen.getByRole("status").textContent).toContain("المؤسسي");
    expect(screen.queryByText("One sign-in to your professional workspace")).toBeNull();
  });
});
