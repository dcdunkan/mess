"use server";

import { cookies } from "next/headers";
import { CookieSessionData, Resident, UserSchema } from "./types";
import { JWTPayload, SignJWT, jwtVerify } from "jose";

const JWT_SIGN_SECRET = process.env.JWT_SIGN_SECRET;
if (JWT_SIGN_SECRET == null) {
    throw new Error("JWT_SIGN_KEY not set");
}
const JWT_SIGN_KEY = new TextEncoder().encode(JWT_SIGN_SECRET);

export async function getSessionData<U extends UserSchema>() {
    const encryptedSessionData = cookies().get("session")?.value;
    return encryptedSessionData ? ((await decrypt(encryptedSessionData)) as CookieSessionData<U>) : null;
}

export async function encrypt<U extends UserSchema>(
    payload: JWTPayload & CookieSessionData<U>,
    expiry: Date
): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiry)
        .sign(JWT_SIGN_KEY);
}

export async function decrypt(input: string): Promise<JWTPayload & CookieSessionData> {
    const result = await jwtVerify<CookieSessionData>(input, JWT_SIGN_KEY, {
        algorithms: ["HS256"],
    });
    return result.payload;
}
