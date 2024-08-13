"use client";

import { MouseEventHandler, useEffect, useRef, useState } from "react";
import { HOSTELS } from "../../lib/constants";
import { useFormState, useFormStatus } from "react-dom";
import { register } from "@/form-handlers";
import { ResidentInput } from "@/lib/types";
import { validateResidentInput } from "@/lib/utilities";
import Link from "next/link";
import { HostelSelector } from "../ui/HostelSelector";

export default function RegisterPage() {
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, dispatch] = useFormState(register, undefined);

    const formElement = useRef<HTMLFormElement>(null);

    // show the red outline if the passwords doesn't match
    useEffect(() => {
        if (formElement.current == null) return;
        const passwordInput = formElement.current["password"],
            confirmPasswordInput = formElement.current["confirm-password"];
        const isMatching = passwordInput.value === confirmPasswordInput.value;
        if (!isMatching) {
            setValidationErrors;
        }
        const color = !isMatching ? "red" : "black";
        passwordInput.style.borderColor = color;
        confirmPasswordInput.style.borderColor = color;
    }, [password, confirmPassword]);

    function revalidateFields() {
        const form = formElement.current;
        if (form == null) return;
        const name = form["full-name"],
            admissionNo = form["admission-no"],
            password = form["password"],
            confirmPassword = form["confirm-password"],
            hostel = form["hostel"];
        const resident = {
            type: "resident",
            name: name.value,
            admission: admissionNo.value,
            password: password.value,
            hostel: hostel.value,
            confirmPassword: confirmPassword.value,
        } satisfies ResidentInput;
        const validated = validateResidentInput(resident);
        setValidationErrors(validated.errors);
        return { ok: validated.ok, resident };
    }

    return (
        <main className="h-screen items-center flex justify-center flex-col mx-auto max-w-screen-lg text-base p-4">
            <div className="md:w-1/2 w-3/4">
                <div className="mb-4 space-y-2">
                    <h1 className="text-4xl font-bold">Register</h1>
                    <p className="text-stone-600">
                        Already have an account?{" "}
                        <Link className="underline font-medium" href={"/login"}>
                            Login here
                        </Link>
                        .
                    </p>
                </div>
                <form
                    className="grid gap-3"
                    autoComplete={"off"}
                    ref={formElement}
                    action={dispatch}
                >
                    <div>
                        <input
                            className="border-2 border-black p-2 w-full"
                            id="full-name"
                            name="full-name"
                            type="text"
                            placeholder="Name"
                            required
                            onChange={revalidateFields}
                        />
                    </div>
                    <div>
                        <input
                            maxLength={6}
                            minLength={6}
                            required
                            className="border-2 border-black p-2 w-full"
                            id="admission-no"
                            name="admission-no"
                            type="number"
                            placeholder="Admission number"
                            onChange={revalidateFields}
                        />
                    </div>
                    <div>
                        <input
                            className="border-2 border-black p-2 w-full"
                            required
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            onKeyUp={(event) => setPassword(event.currentTarget.value)}
                            onChange={revalidateFields}
                        />
                    </div>
                    <div>
                        <input
                            className="border-2 border-black p-2 w-full"
                            required
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm Password"
                            onKeyUp={(event) => setConfirmPassword(event.currentTarget.value)}
                            onChange={revalidateFields}
                        />
                    </div>
                    <div>
                        <HostelSelector onChange={revalidateFields} />
                    </div>

                    {validationErrors.length > 0 && (
                        <ul className="list-disc list-inside text-red-800">
                            {validationErrors.map((problem, i) => {
                                return (
                                    <li key={i} className="list-item">
                                        {problem}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {message && <p className="font-bold text-red-700">{message}</p>}

                    <RegisterButton
                        hasErrors={validationErrors.length != 0}
                        handleClick={(event) => {
                            if (validationErrors.length != 0) {
                                event.preventDefault();
                            }
                        }}
                    />
                </form>
            </div>
        </main>
    );
}

function RegisterButton(props: {
    hasErrors: boolean;
    handleClick: MouseEventHandler<HTMLButtonElement>;
}) {
    const { pending } = useFormStatus();

    return (
        <div className="w-full">
            <button
                className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-150 px-2.5 py-1 float-right disabled:bg-gray-200 disabled:text-gray-600"
                disabled={props.hasErrors}
                aria-disabled={props.hasErrors}
                type="submit"
                onClick={pending ? () => {} : props.handleClick}
            >
                {pending ? "..." : "Register"}
            </button>
        </div>
    );
}
