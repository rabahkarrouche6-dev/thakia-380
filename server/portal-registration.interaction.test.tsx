// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import PortalRegistration from "../client/src/pages/PortalRegistration";

const { startLogin } = vi.hoisted(() => ({ startLogin: vi.fn() }));

vi.mock("@/const", () => ({ startLogin }));
vi.mock("@/contexts/LocaleContext", () => ({
  useLocale: () => ({ locale: "en", direction: "ltr", isEnglish: true }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/register/authority?lang=en", vi.fn()],
}));

describe("PortalRegistration interaction", () => {
  afterEach(cleanup);

  it("offers portal preview instead of opening institutional account selection", () => {
    render(<PortalRegistration />);

    const previewLink = screen.getByRole("link", { name: "Explore the portal before signing in" });
    expect(previewLink.getAttribute("href")).toBe("/preview/authority");
    expect(startLogin).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Start with one secure sign-in" })).toBeNull();
  });
});
