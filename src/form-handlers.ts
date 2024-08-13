"use server";

import { getUser, registerResident } from "@/lib/database";
import { Hostel, UserType } from "@/lib/types";
import { HOSTELS, WEEK } from "@/lib/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReasonedError, userRedirectPath } from "./lib/utilities";
import { encrypt } from "./lib/session";

export async function register(prevState: unknown, formData: FormData) {
    try {
        const name = formData.get("full-name")?.toString();
        const admission = formData.get("admission-no")?.toString();
        const password = formData.get("password")?.toString();
        const hostel = formData.get("hostel")?.toString() as Hostel;
        if (name == null || admission == null || password == null || hostel == null) {
            throw new ReasonedError("Invalid form data");
        }
        await registerResident({
            type: "resident",
            admission: admission,
            hostel: hostel,
            name: name,
            password: password,
        });
        redirect("/login");
    } catch (error) {
        if (error instanceof ReasonedError) {
            return error.reason;
        }
        throw error;
    }
}

export async function login(prevState: unknown, formData: FormData) {
    try {
        const loginField = formData.get("login")?.toString();
        const passwordField = formData.get("password")?.toString();
        const hostelField = formData.get("hostel")?.toString();
        const isAdminField = formData.get("is-admin");

        const isAdminLogin =
            typeof hostelField === "string" &&
            // hostelField in HOSTELS &&
            typeof isAdminField === "string" &&
            isAdminField != null &&
            isAdminField === "on";

        const loginType: UserType = isAdminLogin ? "manager" : "resident";

        if (loginField == null || passwordField == null) {
            throw new ReasonedError("Invalid credentials");
        }

        const user = await getUser({
            type: loginType,
            login: loginField,
            hostel: hostelField,
            password: passwordField,
        });
        const expires = new Date(Date.now() + 2 * WEEK);
        const session = await encrypt(
            {
                user: {
                    _id: user._id.toString(),
                    type: user.type,
                    name: user.name,
                    hostel: user.hostel,
                },
                expires: expires,
            },
            expires
        );
        cookies().set("session", session, {
            expires,
            httpOnly: true,
            sameSite: "lax",
        });
        redirect(userRedirectPath(loginType));
    } catch (error) {
        if (error instanceof ReasonedError) {
            return error.reason;
        }
        throw error;
    }
}
