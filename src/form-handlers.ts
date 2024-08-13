"use server";

import { getResident, registerResident } from "@/lib/database";
import { Hostel, Manager, Resident, Superuser, UserType } from "@/lib/types";
import { WEEK } from "@/lib/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReasonedError, userRedirectPath } from "./lib/utilities";
import { encrypt } from "./lib/session";

export async function register(_: unknown, formData: FormData) {
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

export async function login(_: unknown, formData: FormData) {
    try {
        const loginField = formData.get("login")?.toString();
        const passwordField = formData.get("password")?.toString();
        if (typeof loginField !== "string" || typeof passwordField !== "string") {
            throw new ReasonedError("Invalid credentials");
        }
        const isAdminField = formData.get("is-admin");

        const isAdminLoginToggled = typeof isAdminField === "string" && isAdminField != null && isAdminField === "on";
        const loginType: UserType = isAdminLoginToggled
            ? loginField === process.env.SUPERUSER_LOGIN && passwordField === process.env.SUPERUSER_PASSWORD
                ? "superuser"
                : loginField === process.env.MANAGER_LOGIN && passwordField === process.env.MANAGER_PASSWORD
                ? "manager"
                : "resident"
            : "resident";

        const expires = new Date(Date.now() + 1 * WEEK);
        let session: string;

        if (loginType === "superuser") {
            session = await encrypt<Superuser>(
                {
                    user: {
                        _id: "superuser",
                        type: "superuser",
                        name: "Superuser",
                    },
                    expires: expires,
                },
                expires
            );
        } else if (loginType === "manager") {
            session = await encrypt<Manager>(
                {
                    user: {
                        _id: "manager",
                        type: "manager",
                        name: "Manager",
                        login: "manager",
                    },
                    expires: expires,
                },
                expires
            );
        } else if (loginType === "resident") {
            const user = await getResident({
                admission: loginField,
                password: passwordField,
            });
            session = await encrypt<Resident>(
                {
                    user: {
                        _id: user._id.toString(),
                        type: "resident",
                        name: user.name,
                        hostel: user.hostel,
                    },
                    expires: expires,
                },
                expires
            );
        } else {
            throw new ReasonedError("Something went wrong.");
        }

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
