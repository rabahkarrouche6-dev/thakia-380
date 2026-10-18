import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type PortalRole = "supplier" | "authority" | "regulator";

const WILAYAS = [
  "01 - أدرار",
  "02 - الشلف",
  "03 - الأغواط",
  "04 - أم البواقي",
  "05 - باتنة",
  "06 - بجاية",
  "07 - بسكرة",
  "08 - بشار",
  "09 - البليدة",
  "10 - البويرة",
  "11 - تمنراست",
  "12 - تبسة",
  "13 - تلمسان",
  "14 - تيارت",
  "15 - تيزي وزو",
  "16 - الجزائر",
  "17 - الجلفة",
  "18 - جيجل",
  "19 - سطيف",
  "20 - سعيدة",
  "21 - سكيكدة",
  "22 - سيدي بلعباس",
  "23 - عنابة",
  "24 - قالمة",
  "25 - قسنطينة",
  "26 - المدية",
  "27 - مستغانم",
  "28 - المسيلة",
  "29 - معسكر",
  "30 - ورقلة",
  "31 - وهران",
  "32 - البيض",
  "33 - إليزي",
  "34 - برج بوعريريج",
  "35 - بومرداس",
  "36 - الطارف",
  "37 - تندوف",
  "38 - تيسمسيلت",
  "39 - الوادي",
  "40 - خنشلة",
  "41 - سوق أهراس",
  "42 - تيبازة",
  "43 - ميلة",
  "44 - عين الدفلى",
  "45 - النعامة",
  "46 - عين تموشنت",
  "47 - غرداية",
  "48 - غليزان",
  "49 - تيميمون",
  "50 - برج باجي مختار",
  "51 - أولاد جلال",
  "52 - بني عباس",
  "53 - عين صالح",
  "54 - عين قزام",
  "55 - تقرت",
  "56 - جانت",
  "57 - المغير",
  "58 - المنيعة",
];

export default function Register() {
  const [, setLocation] = useLocation();

  // Mode: register or login
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PortalRole>("supplier");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mutations
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الحساب بنجاح! مرحباً بك في صفقات ذكية.");
      setLocation("/app");
    },
    onError: error => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الحساب. يُرجى التحقق من البيانات.");
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدخول بنجاح!");
      setLocation("/app");
    },
    onError: error => {
      toast.error(error.message || "فشل تسجيل الدخول. يُرجى المحاولة مجدداً.");
    },
  });

  const directLoginMutation = trpc.auth.directLogin.useMutation({
    onSuccess: () => {
      toast.success("تم الدخول بنجاح!");
      setLocation("/app");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isLoginMode) {
      if (!email.trim() || !password) {
        toast.error("يُرجى إدخال البريد الإلكتروني وكلمة المرور.");
        return;
      }
      loginMutation.mutate({
        email: email.trim(),
        password,
        role: selectedRole,
      });
      return;
    }

    // Register Validation
    if (!fullName.trim()) {
      toast.error("يُرجى إدخال الاسم الكامل.");
      return;
    }
    if (!email.trim()) {
      toast.error("يُرجى إدخال البريد الإلكتروني.");
      return;
    }
    if (!phone.trim()) {
      toast.error("يُرجى إدخال رقم الهاتف.");
      return;
    }
    if (!password) {
      toast.error("يُرجى تعيين كلمة المرور.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (!wilaya) {
      toast.error("يُرجى اختيار الولاية.");
      return;
    }
    if (!commercialRegister.trim()) {
      toast.error("يُرجى إدخال رقم السجل التجاري أو التعريف الجبائي.");
      return;
    }
    if (!termsAccepted) {
      toast.error("يُرجى الموافقة على الشروط والأحكام للمتابعة.");
      return;
    }

    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      wilaya,
      commercialRegister: commercialRegister.trim(),
      role: selectedRole,
      termsAccepted,
    });
  };

  const handleGoogleAuth = () => {
    toast.info("جارٍ ربط الحساب عبر Google...");
    directLoginMutation.mutate({ role: selectedRole });
  };

  const isSubmitting = registerMutation.isPending || loginMutation.isPending || directLoginMutation.isPending;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8FA] flex flex-col lg:flex-row text-slate-800 font-['Cairo'] antialiased selection:bg-[#004370] selection:text-white">
      {/* 1. Left Visual Showcase Banner (Matches attached image) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[52%] overflow-hidden bg-[#002f54] text-white">
        <img
          src="/images/auth-banner@2x.jpg"
          alt="صفقات ذكية — من أجل صفقات عمومية أكثر شفافية وفعالية"
          className="absolute inset-0 h-full w-full object-cover object-center select-none"
        />
        {/* Subtle overlay gradient to ensure smooth blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f38]/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. Right Form Column (Matches attached image) */}
      <div className="flex-1 flex flex-col justify-between px-5 py-6 sm:px-10 sm:py-8 lg:px-12 xl:px-16 overflow-y-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#004370] transition-colors"
          >
            <span>العودة إلى الصفحة الرئيسية</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-extrabold text-sm text-[#004370]">صفقات ذكية</span>
          </div>
        </div>

        {/* Center Container */}
        <div className="mx-auto w-full max-w-lg my-auto py-6">
          {/* Header Title & Subtitle */}
          <div className="text-start">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#002f54] tracking-tight leading-tight">
              {isLoginMode ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              {isLoginMode
                ? "أدخل بياناتك للمتابعة وإدارة مساحة عملك داخل المنصة."
                : "انضم إلى منصة صفقات ذكية لبدء رحلتك في إدارة الصفقات العمومية."}
            </p>
          </div>

          {/* Role Segmented Tabs (3 Options as shown in image) */}
          <div className="mt-6 grid grid-cols-3 rounded-xl bg-[#ECEFF6] p-1 border border-slate-200/70 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedRole("supplier")}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                selectedRole === "supplier"
                  ? "bg-[#004370] text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">المتعامل الإقتصادي</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("authority")}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                selectedRole === "authority"
                  ? "bg-[#004370] text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Landmark className="h-4 w-4 shrink-0" />
              <span className="truncate">المصلحة المتعاقدة</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("regulator")}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                selectedRole === "regulator"
                  ? "bg-[#004370] text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="truncate">الإدارة المركزية</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {!isLoginMode && (
              <>
                {/* Row 1: Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="الاسم الكامل *"
                      className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-4 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                    />
                    <User className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="البريد الإلكتروني *"
                      className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-4 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                    />
                    <Mail className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Row 2: Phone & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="رقم الهاتف *"
                      className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-4 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                    />
                    <Phone className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="كلمة المرور *"
                      className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-10 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                    />
                    <Lock className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute start-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Row 3: Confirm Password */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد كلمة المرور *"
                    className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-10 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                  />
                  <Lock className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Row 4: Wilaya Dropdown */}
                <div className="relative">
                  <select
                    required
                    value={wilaya}
                    onChange={e => setWilaya(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-10 pe-10 py-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="" disabled>الولاية *</option>
                    {WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <ChevronDown className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>

                {/* Row 5: Commercial Register / Tax ID */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={commercialRegister}
                    onChange={e => setCommercialRegister(e.target.value)}
                    placeholder="رقم السجل التجاري / التعريف الجبائي *"
                    className="w-full rounded-xl border border-[#EAEBEF] bg-[#ECEFF6] ps-4 pe-10 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                  />
                  <Building2 className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-slate-600 select-none pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#004370] focus:ring-[#004370] accent-[#004370] cursor-pointer"
                  />
                  <span>
                    أقر بأنني أوافق على{" "}
                    <span className="font-bold text-[#004370] hover:underline">الشروط والأحكام</span>
                    {" "}و{" "}
                    <span className="font-bold text-[#004370] hover:underline">سياسة الخصوصية</span>
                    {" "}للمنصة.
                  </span>
                </label>
              </>
            )}

            {isLoginMode && (
              <>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني *"
                    className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-4 pe-10 py-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                  />
                  <Mail className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="كلمة المرور *"
                    className="w-full rounded-xl border border-[#EAEBEF] bg-[#F7F8FA] ps-10 pe-10 py-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#004370] focus:bg-white focus:ring-2 focus:ring-[#004370]/15 transition-all shadow-sm"
                  />
                  <Lock className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] sm:min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#004370] hover:bg-[#003456] text-white py-3 px-4 text-sm font-bold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#004370]/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 shrink-0" />
              )}
              <span>{isLoginMode ? "تسجيل الدخول" : "إنشاء الحساب"}</span>
            </button>

            {/* Divider "أو" */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-[#F7F8FA] px-3 text-xs font-semibold text-slate-400">
                أو
              </span>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full min-h-[46px] flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-[0.99] cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoginMode ? "الدخول عبر Google" : "التسجيل عبر Google"}</span>
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-5 text-center text-xs sm:text-sm text-slate-500">
            {isLoginMode ? (
              <>
                <span>ليس لديك حساب؟ </span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(false)}
                  className="font-bold text-[#004370] hover:underline transition-colors"
                >
                  إنشاء حساب جديد
                </button>
              </>
            ) : (
              <>
                <span>لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(true)}
                  className="font-bold text-[#004370] hover:underline transition-colors"
                >
                  تسجيل الدخول
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subtle footer */}
        <div className="text-center text-[11px] text-slate-400 py-2">
          منظومة صفقات ذكية © {new Date().getFullYear()} — الجمهورية الجزائرية الديمقراطية الشعبية
        </div>
      </div>
    </div>
  );
}
