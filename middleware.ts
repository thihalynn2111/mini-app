import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("🔥🔥🔥 MIDDLEWARE RUN:", request.nextUrl.pathname);
  // Browser cookie ထဲက JWT token ကို ယူစစ်ခြင်း
  const token = request.cookies.get("token")?.value;

  const url = request.url;

  // 1. Login မဝင်ထားရင် dashboard ထဲ ဝင်မရအောင် တားပြီး login page ဆီ ပို့ရန်
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Login ဝင်ပြီးသားလူက login page ကို ပြန်မသွားနိုင်အောင် တားရန်
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard/feed", request.url));
  }

  return NextResponse.next();
}

// ဘယ် Path တွေမှာ Middleware အလုပ်လုပ်ရမယ်ဆိုတာ သတ်မှတ်ခြင်း (Matcher)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard/feed",
    "/userprofile",
    "/login",
    "/register",
  ],
};
