"use client";

import { login } from "@/form-handlers";
import { Checkbox } from "@nextui-org/react";
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { HostelSelector } from "../ui/HostelSelector";

export default function LoginPage() {
    const [message, dispatch] = useFormState(login, undefined);
    const [isAdminLogin, setIsAdminLogin] = useState(false);

    return (
        <main className="h-screen items-center flex justify-center flex-col mx-auto max-w-screen-lg text-base p-4">
            <div className="md:w-1/2 w-3/4">
                <div className="flex place-items-baseline justify-between">
                    <h1 className="text-4xl font-bold mb-4">Login</h1>
                    <p className="text-lg">
                        ...or{" "}
                        <Link className="underline font-medium" href="/register">
                            register
                        </Link>
                        ?
                    </p>
                </div>

                <form className="grid gap-3" autoComplete={"off"} action={dispatch}>
                    <div>
                        {isAdminLogin ? (
                            <input
                                required
                                className="border-2 border-black p-2 w-full"
                                id="login"
                                name="login"
                                type="string"
                                placeholder="Admin handle"
                            />
                        ) : (
                            <input
                                maxLength={6}
                                minLength={6}
                                required
                                className="border-2 border-black p-2 w-full"
                                id="login"
                                name="login"
                                type="string"
                                placeholder="Admission number"
                            />
                        )}
                    </div>
                    <div>
                        <input
                            className="border-2 border-black p-2 w-full"
                            required
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                        />
                    </div>
                    <input
                        type="checkbox"
                        hidden
                        checked={isAdminLogin}
                        name="is-admin"
                        id="is-admin"
                        readOnly
                    />
                    <Checkbox onValueChange={setIsAdminLogin} isSelected={isAdminLogin}>
                        Login as admin
                    </Checkbox>

                    {isAdminLogin && <HostelSelector onChange={() => false} />}

                    {message && <p className="font-bold text-red-700">{message}</p>}

                    <LoginButton />
                </form>
            </div>
        </main>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <div className="w-full">
            <button
                className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-150 px-2.5 py-1 float-right disabled:bg-gray-200 disabled:text-gray-600"
                type="submit"
                disabled={pending}
            >
                Login
            </button>
        </div>
    );
}
