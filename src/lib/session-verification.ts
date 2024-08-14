import "server-only";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { cache } from "react";
import { CookieSessionData, UserSchema } from "./types";

export const verifySession = cache(async () => {
    const cookie = cookies().get("session")?.value;
    if (cookie == null) redirect("/login");

    const session = await decrypt(cookie);
    if (!session.user) {
        redirect("/login");
    }

    return { isAuth: true, user: session.user as CookieSessionData<UserSchema> };
});
