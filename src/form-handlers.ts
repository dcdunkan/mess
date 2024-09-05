"use server";

import { getResident, updatePassword, addResident } from "@/lib/database";
import { Manager, Resident, Superuser, UserType } from "@/lib/types";
import { WEEK } from "@/lib/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReasonedError, userRedirectPath } from "./lib/utilities";
import { encrypt, getSessionData } from "./lib/session";

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
                        admission: user.admission,
                        name: user.name,
                        hostel: user.hostel,
                        room: user.room,
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
export async function changePassword(_: { success: boolean; message: string }, formData: FormData) {
    try {
        const session = await getSessionData<Resident>();
        if (session == null || session.user.type != "resident") {
            throw new ReasonedError("Invalid session");
        }
        const currentPassword = formData.get("currentPassword")?.toString().trim();
        const updatedPassword = formData.get("updatedPassword")?.toString().trim();
        if (
            currentPassword == null ||
            updatedPassword == null ||
            currentPassword.length === 0 ||
            updatedPassword.length === 0
        ) {
            throw new ReasonedError("Invalid form data");
        }
        if (updatedPassword.length < 6) {
            throw new ReasonedError("Password must be at least 6 characters long.");
        }
        if (updatedPassword.length > 32) {
            throw new ReasonedError("Password cannot be longer than 32 characters.");
        }
        await updatePassword({
            admission: session.user.admission,
            currentPassword: currentPassword,
            newPassword: updatedPassword,
        });
        return { success: true, message: "Changed password successfully." };
    } catch (error) {
        if (error instanceof ReasonedError) {
            return { success: false, message: error.reason };
        }
        return { success: false, message: "Something went wrong." };
    }
}

export async function addResidentFormHandler(_: unknown, formData: FormData) {
    try {
        const session = await getSessionData<Superuser>();
        if (session == null || session.user.type != "superuser") {
            throw new ReasonedError("Invalid session");
        }

        const name = formData.get("full-name")?.toString();
        const admission = formData.get("admission-no")?.toString();
        const hostel = formData.get("hostel")?.toString();
        const room = formData.get("room")?.toString();

        if (
            name == null ||
            admission == null ||
            hostel == null ||
            room == null ||
            name.length < 2 ||
            admission.length < 2 ||
            hostel.length < 2 ||
            room.length < 2
        ) {
            throw new ReasonedError("Invalid form data");
        }
        await addResident({
            type: "resident",
            admission: admission,
            hostel: hostel,
            name: name,
            room: room,
            password: admission,
        });
        return { ok: true };
    } catch (error) {
        if (error instanceof ReasonedError) {
            return { ok: false, error: error.reason };
        }
        throw error;
    }
}
