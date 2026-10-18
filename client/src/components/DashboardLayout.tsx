import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { accountIdentityCardClass, accountIdentityNameClass, getDisplayName } from "@/lib/userIdentity";
import { Building2, LayoutDashboard, LogOut, Menu, ShieldCheck, Sparkles, Store, UsersRound, X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { AUTH_ROUTES } from "@shared/login";
import { useLocale } from "@/contexts/LocaleContext";
import LanguageToggle from "@/components/LanguageToggle";
import DirectPortalSelector from "@/components/DirectPortalSelector";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import React, { useState } from "react";

export type NavItem = { label: string; path: string; icon: typeof LayoutDashboard; group?: string };

export default function DashboardLayout({
  children,
  items = [],
  title = "صفقات ذكية",
}: {
  children: React.ReactNode;
  items?: NavItem[];
  title?: string;
}) {
  const { loading, user, logout } = useAuth();
  const { direction, isEnglish } = useLocale();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const activeSection = new URLSearchParams(search).get("section");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const utils = trpc.useUtils();
  const directLoginMutation = trpc.auth.directLogin.useMutation({
    onSuccess: async (data) => {
      if (data.token) {
        try {
          sessionStorage.setItem("manus-cookie", `app_session_id=${data.token}`);
          localStorage.setItem("manus-cookie", `app_session_id=${data.token}`);
        } catch {}
      }
      utils.auth.me.setData(undefined, data.user as any);
      toast.success(isEnglish ? `Switched to: ${data.user.name}` : `تم تبديل البوابة إلى: ${data.user.name}`);
      setTimeout(() => {
        window.location.assign("/app");
      }, 150);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const copy = isEnglish
    ? {
        loading: "Loading workspace…", loginRequired: "Sign-in required", protectedArea: "This area is protected and reserved for registered platform users.", signIn: "Sign in",
        home: "Dashboard", platformName: "Smart Procurement", platformSubtitle: "Public procurement portal", currentWorkspace: "Current workspace",
        verifiedAccount: "Verified account", authority: "Contracting authority", regulator: "Central administration", supplier: "Economic operator", user: "User",
        securePortal: "Secure portal", backToPortals: "Back to portal selection", internalAccount: "Internal account", accountMenu: "Account menu", signOut: "Sign out",
      }
    : {
        loading: "جاري تحميل مساحة العمل…", loginRequired: "الدخول مطلوب", protectedArea: "هذه المساحة محمية ومخصصة للمستخدمين المسجلين في المنصة.", signIn: "تسجيل الدخول",
        home: "الرئيسية", platformName: "صفقات ذكية", platformSubtitle: "بوابة الصفقات العمومية", currentWorkspace: "المساحة الحالية",
        verifiedAccount: "حساب موثق", authority: "مصلحة متعاقدة", regulator: "إدارة مركزية", supplier: "متعامل اقتصادي", user: "مستخدم",
        securePortal: "بوابة آمنة", backToPortals: "العودة إلى اختيار البوابة", internalAccount: "حساب داخلي", accountMenu: "قائمة الحساب", signOut: "تسجيل الخروج",
      };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f4f7fb] text-[#64748b]" dir={direction}>
        {copy.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f4f7fb] p-4 sm:p-8" dir={direction}>
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-200">
          <DirectPortalSelector />
        </div>
      </div>
    );
  }

  const displayItems = items.length
    ? items
    : [{ label: copy.home, path: "/app", icon: LayoutDashboard }];
  const displayName = getDisplayName(user.name);
  const navigateTo = (path: string) => {
    setLocation(path);
    setMobileNavigationOpen(false);
  };
  const NavigationItems = ({ compact = false }: { compact?: boolean }) => (
    <>
      {displayItems.map((item, index) => {
        const showGroup = Boolean(item.group) && (index === 0 || displayItems[index - 1]?.group !== item.group);
        const [itemLocation, itemSearch = ""] = item.path.split("?");
        const itemSection = new URLSearchParams(itemSearch).get("section");
        const isActive = location === itemLocation && (itemSection ? itemSection === activeSection : !activeSection);
        return (
          <div key={`${item.path}:${item.label}`} className={showGroup && index > 0 ? "pt-4" : ""}>
            {showGroup && <div className={`mb-1 flex items-center gap-2 px-4 pt-2 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/40 ${isEnglish ? "text-left" : "text-right"}`}><span className="h-px flex-1 bg-white/10" aria-hidden="true" /><span>{item.group}</span></div>}
            <button
              type="button"
              onClick={() => navigateTo(item.path)}
              aria-current={isActive ? "page" : undefined}
              className={`group relative w-full flex items-center gap-3 overflow-hidden px-4 ${compact ? "py-3.5" : "py-3"} rounded-2xl ${isEnglish ? "text-left" : "text-right"} transition-[background-color,color,transform,box-shadow] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8e5d1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#092e49] ${isActive ? "translate-x-0 bg-white/14 text-white shadow-[0_10px_24px_rgba(0,0,0,.12)]" : "text-white/65 hover:-translate-x-0.5 hover:bg-white/8 hover:text-white"}`}
            >
              {isActive && <span aria-hidden="true" className={`absolute inset-y-2 w-1 rounded-full bg-[#b8e5d1] shadow-[0_0_14px_rgba(184,229,209,.7)] ${isEnglish ? "left-1" : "right-1"}`} />}<span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${isActive ? "bg-[#b8e5d1] text-[#092e49]" : "bg-white/7 text-white/70 group-hover:bg-white/12 group-hover:text-[#b8e5d1]"}`}><item.icon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 truncate text-sm font-semibold">{item.label}</span>
            </button>
          </div>
        );
      })}
    </>
  );

  return (
    <div dir={direction} className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(184,229,209,.28),transparent_28%),linear-gradient(135deg,#f7fafc_0%,#eef5f4_100%)] text-[#122b3c] flex dark:bg-[radial-gradient(circle_at_top_left,rgba(55,197,155,.12),transparent_28%),linear-gradient(135deg,#0a202c_0%,#102f3d_100%)]">
      <aside className="hidden lg:flex w-[304px] shrink-0 bg-[linear-gradient(180deg,#092e49_0%,#061f33_100%)] text-white flex-col min-h-screen sticky top-0 h-screen border-e border-white/10 shadow-[18px_0_50px_rgba(9,46,73,.12)]">
        <div className="px-6 pt-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#b8e5d1] text-[#092e49] grid place-items-center shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">{copy.platformName}</div>
              <div className="text-[11px] text-white/55 mt-1">{copy.platformSubtitle}</div>
            </div>
          </div>
        </div>
        <nav aria-label={title} className="p-4 space-y-1.5 flex-1 overflow-y-auto"><NavigationItems /></nav>
        <div className="p-4 border-t border-white/10">
          <div className="rounded-2xl border border-white/10 bg-white/7 p-4 shadow-inner shadow-black/10">
            <div className="mb-3 flex items-center justify-between gap-3"><div className="text-[11px] text-white/50">{copy.currentWorkspace}</div><span className="rounded-full bg-[#b8e5d1]/15 px-2 py-1 text-[10px] font-bold text-[#b8e5d1]">LIVE</span></div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-2 text-xs text-[#b8e5d1]">
              {copy.verifiedAccount} • {user.role === "authority" ? copy.authority : user.role === "regulator" ? copy.regulator : user.role === "supplier" ? copy.supplier : copy.user}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-[82px] bg-white/80 backdrop-blur-xl border-b border-white/70 shadow-[0_8px_30px_rgba(9,46,73,.05)] flex items-center justify-between px-4 sm:px-6 lg:px-10 sticky top-0 z-20 dark:bg-[#102f3d]/85 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button type="button" aria-label={isEnglish ? "Open navigation" : "فتح قائمة التنقل"} aria-expanded={mobileNavigationOpen} onClick={() => setMobileNavigationOpen(true)} className="lg:hidden h-10 w-10 rounded-xl border border-slate-200 grid place-items-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d5c79]">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0d8062]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a36f] shadow-[0_0_10px_rgba(22,163,111,.7)]" aria-hidden="true" />{copy.securePortal}</div>
              <div className="truncate text-lg font-black tracking-tight text-[#092e49] dark:text-white">{title}</div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <LanguageToggle className="hidden sm:inline-flex" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden sm:inline-flex h-10 items-center gap-1.5 justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0d5c79] transition-colors hover:border-[#b8e5d1] hover:bg-[#f5fbf8] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d5c79]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{isEnglish ? "Switch Portal" : "تبديل البوابة"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuItem
                  onClick={() => directLoginMutation.mutate({ role: "supplier" })}
                  className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-emerald-50"
                >
                  <Store className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-xs">{isEnglish ? "Economic Operator" : "المتعامل الاقتصادي"}</div>
                    <div className="text-[10px] text-slate-400">{isEnglish ? "Tenders & Bidding" : "تصفح وتقديم العروض"}</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => directLoginMutation.mutate({ role: "authority" })}
                  className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-sky-50"
                >
                  <Building2 className="h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-bold text-xs">{isEnglish ? "Contracting Authority" : "المصلحة المتعاقدة"}</div>
                    <div className="text-[10px] text-slate-400">{isEnglish ? "Tender Management" : "إعداد الصفقات وتقييم العروض"}</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => directLoginMutation.mutate({ role: "regulator" })}
                  className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-slate-100"
                >
                  <ShieldCheck className="h-4 w-4 text-[#092e49]" />
                  <div>
                    <div className="font-bold text-xs">{isEnglish ? "Central Administration" : "الإدارة المركزية"}</div>
                    <div className="text-[10px] text-slate-400">{isEnglish ? "Oversight & Radar" : "الرادار الرقابي والحوكمة"}</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden min-w-0 sm:block">
              <div className={accountIdentityCardClass}>
                <div className="relative min-w-0">
                  <div className={accountIdentityNameClass} title={displayName}>
                    {displayName}
                  </div>
                  <div className="mt-0.5 truncate whitespace-nowrap text-[11px] text-slate-500" title={user.email || copy.internalAccount}>
                    {user.email || copy.internalAccount}
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus-visible:ring-2 focus-visible:ring-[#0d5c79] rounded-full" aria-label={copy.accountMenu}>
                  <Avatar className="h-10 w-10 border-2 border-[#b8e5d1]">
                    <AvatarFallback className="bg-[#e9f5ef] text-[#0d5c79] font-bold">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className={`h-4 w-4 ${isEnglish ? "mr-2" : "ml-2"}`} />
                  {copy.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
      {mobileNavigationOpen && <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={isEnglish ? "Workspace navigation" : "تنقل مساحة العمل"}>
        <button type="button" aria-label={isEnglish ? "Close navigation" : "إغلاق قائمة التنقل"} onClick={() => setMobileNavigationOpen(false)} className="absolute inset-0 bg-[#092e49]/45 backdrop-blur-[2px]" />
        <aside className={`absolute top-0 h-full w-[min(86vw,340px)] bg-[#092e49] text-white shadow-2xl ${isEnglish ? "left-0" : "right-0"}`}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <div><div className="font-bold">{copy.platformName}</div><div className="mt-1 text-[11px] text-white/55">{title}</div></div>
            <button type="button" aria-label={isEnglish ? "Close navigation" : "إغلاق قائمة التنقل"} onClick={() => setMobileNavigationOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8e5d1]"><X className="h-5 w-5" /></button>
          </div>
          <nav aria-label={title} className="space-y-1.5 overflow-y-auto p-4"><NavigationItems compact /></nav>
        </aside>
      </div>}
    </div>
  );
}

export const roleIcons = { supplier: Store, authority: UsersRound, regulator: ShieldCheck, user: Sparkles };
