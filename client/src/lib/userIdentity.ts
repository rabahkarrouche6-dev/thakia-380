export const accountIdentityCardClass =
  "relative max-w-[17rem] overflow-hidden rounded-2xl border border-white/75 bg-gradient-to-br from-white/90 via-white/60 to-emerald-50/50 px-3.5 py-2.5 text-left shadow-[0_10px_28px_rgba(9,46,73,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-white before:to-transparent";

export const accountIdentityNameClass =
  "block min-w-0 truncate whitespace-nowrap text-sm font-bold text-[#092e49]";

export function getDisplayName(name?: string | null) {
  return name?.trim() || "مستخدم المنصة";
}
