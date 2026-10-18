/**
 * يسمح بالعودة فقط إلى مسار سابق من النطاق نفسه، حتى لا يغادر زر العودة
 * المستخدم إلى موقع خارجي عندما تُفتح صفحة الحالة مباشرةً.
 */
export function canReturnWithinApp(referrer: string, currentOrigin: string, historyLength: number) {
  if (!referrer || historyLength < 2) return false;

  try {
    return new URL(referrer).origin === currentOrigin;
  } catch {
    return false;
  }
}
