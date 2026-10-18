import React from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Landmark } from "lucide-react";
import DirectPortalSelector from "@/components/DirectPortalSelector";

export default function LoginRedirect() {
  const [, setLocation] = useLocation();

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] text-[#173a5a]">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#092e49] text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-black text-[#092e49]">صفقات ذكية</span>
              <span className="block text-[10px] text-slate-400">بوابة الصفقات العمومية الجزائرية</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#092e49] transition"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <DirectPortalSelector
          title="اختيار بوابة الدخول المباشر"
          subtitle="اختر المساحة التي ترغب في دخولها فوراً. تم إلغاء نموذج التسجيل وكلمات المرور لتسهيل الاستعراض والاستخدام المباشر."
          onSuccess={() => setLocation("/app")}
        />
      </main>
    </div>
  );
}
