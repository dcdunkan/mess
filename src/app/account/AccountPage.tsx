"use client";

import { changePassword } from "@/form-handlers";
import { CookieSessionData, Resident } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";

export default function AccountPage(props: {
    sessionData: CookieSessionData<Resident>;
    hostels: Record<string, string>;
}) {
    const [state, formAction, pending] = useFormState(changePassword, {
        success: false,
        message: "",
    });
    const [validationMessage, setValidationMessage] = useState<string>();

    useEffect(() => {
        if (state.success) window.location.reload();
        if (!state.success) setValidationMessage(state.message);
    }, [state]);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewConfirmedPassword, setShowNewConfirmedPassword] = useState(false);

    return (
        <main className="space-y-8 mx-auto max-w-screen-lg text-base">
            <div className="m-8">
                <div className="flex justify-between place-items-center">
                    <div className="text-3xl my-4 font-semibold">Settings</div>

                    <div className="flex space-x-5">
                        <Link href={"/"}>
                            <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white text-base">
                                Go home
                            </div>
                        </Link>
                        <a href={"/logout"}>
                            <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white text-base">
                                Logout
                            </div>
                        </a>
                    </div>
                </div>
                <div className="space-y-10">
                    <div className="space-y-2">
                        <h2 className="text-xl">Account Details</h2>
                        <p className="text-base">Your account details are listed below.</p>

                        <div className="grid grid-cols-2 gap-2 border p-4 ">
                            <div className="font-medium">Admission Number</div>
                            <div>{props.sessionData.user.admission}</div>
                            <div className="font-medium">Name</div>
                            <div>{props.sessionData.user.name}</div>
                            <div className="font-medium">Hostel</div>
                            <div>{props.hostels[props.sessionData.user.hostel] ?? props.sessionData.user.hostel}</div>
                            <div className="font-medium">Room</div>
                            <div>{props.sessionData.user.room}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl">Change Password</h2>
                        <p className="text-base">Change your password using the following fields:</p>

                        <form
                            className="my-4 space-y-2 w-full md:max-w-lg"
                            action={(formData) => {
                                const currentPassword = formData.get("currentPassword")?.toString().trim();
                                const updatedPassword = formData.get("updatedPassword")?.toString().trim();
                                const confirmUpdatedPassword = formData
                                    .get("confirmUpdatedPassword")
                                    ?.toString()
                                    .trim();
                                if (
                                    currentPassword == null ||
                                    updatedPassword == null ||
                                    confirmUpdatedPassword == null ||
                                    currentPassword.length === 0 ||
                                    updatedPassword.length === 0 ||
                                    confirmUpdatedPassword.length === 0
                                ) {
                                    setValidationMessage("Invalid password details");
                                    return;
                                }
                                if (updatedPassword.length < 6 || confirmUpdatedPassword.length < 6) {
                                    setValidationMessage("Passwords must be at least 6 characters long.");
                                    return;
                                }
                                if (updatedPassword.length > 32 || confirmUpdatedPassword.length > 32) {
                                    setValidationMessage("Passwords cannot be longer than 32 characters.");
                                    return;
                                }
                                if (updatedPassword !== confirmUpdatedPassword) {
                                    setValidationMessage("New password must match with the confirmed new password.");
                                    return;
                                }
                                if (currentPassword === updatedPassword) {
                                    setValidationMessage("Current password and updated password cannot be same.");
                                    return;
                                }
                                formAction(formData);
                            }}
                        >
                            <div className="flex gap-1">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="currentPassword"
                                    id="currentPassword"
                                    placeholder="Current password"
                                    className="border-2 p-2 rounded w-full"
                                />
                                <div
                                    className="border-2 p-2 rounded select-none"
                                    onClick={() => setShowCurrentPassword((x) => !x)}
                                >
                                    {showCurrentPassword ? "hide" : "show"}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="updatedPassword"
                                    id="updatedPassword"
                                    placeholder="New password"
                                    className="border-2 p-2 rounded w-full"
                                />
                                <div
                                    className="border-2 p-2 rounded select-none"
                                    onClick={() => setShowNewPassword((x) => !x)}
                                >
                                    {showNewPassword ? "hide" : "show"}
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <input
                                    type={showNewConfirmedPassword ? "text" : "password"}
                                    name="confirmUpdatedPassword"
                                    id="confirmUpdatedPassword"
                                    placeholder="Confirm new password"
                                    className="border-2 p-2 rounded w-full"
                                />
                                <div
                                    className="border-2 p-2 rounded select-none"
                                    onClick={() => setShowNewConfirmedPassword((x) => !x)}
                                >
                                    {showNewConfirmedPassword ? "hide" : "show"}
                                </div>
                            </div>
                            {!state.success && validationMessage && validationMessage.length > 0 && (
                                <p className="font-bold text-red-700">{validationMessage}</p>
                            )}
                            {state.success && state.message.length > 0 && (
                                <p className="font-bold text-green-700">{state.message}</p>
                            )}
                            <button
                                type="submit"
                                disabled={pending}
                                className="bg-black px-3 py-2 rounded text-white disabled:cursor-not-allowed disabled:bg-black/50"
                            >
                                {pending ? "Changing password..." : "Change password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
