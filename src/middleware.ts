import { NextResponse, NextRequest } from "next/server";
import { decrypt, encrypt } from "./lib/session";
import { WEEK } from "./lib/constants";
import { userRedirectPath } from "./lib/utilities";

const PUBLIC_ROUTES = ["/menu"];

const ROUTES = {
    manager: ["/manager"],
    resident: ["/"],
    superuser: ["/superuser"],
};

export async function middleware(request: NextRequest) {
    if (PUBLIC_ROUTES.includes(request.nextUrl.pathname)) return NextResponse.next();
    const session = request.cookies.get("session")?.value;

    if (session != null) {
        try {
            const expires = new Date(Date.now() + 1 * WEEK);
            const parsed = { user: await decrypt(session), expires };
            const response = // should redirect to default path => protected
                ["/login", "/register"].includes(request.nextUrl.pathname) ||
                !ROUTES[parsed.user.type].includes(request.nextUrl.pathname)
                    ? NextResponse.redirect(new URL(userRedirectPath(parsed.user.type), request.url))
                    : NextResponse.next();

            response.cookies.set({
                name: "session",
                value: await encrypt(parsed.user, expires),
                httpOnly: true,
                expires: expires,
                sameSite: "lax",
            });
            return response;
        } catch (err) {
            const response = NextResponse.redirect(new URL("/logout", request.url));
            response.cookies.delete("session");
            return response;
        }
    }

    if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
    matcher: ["/((?!logout|api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
