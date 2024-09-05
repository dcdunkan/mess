"use client";

import { deleteResident, resetPassword, updateHostels } from "@/lib/database";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { DatabaseMetadata } from "@/lib/types";
import { useFormState, useFormStatus } from "react-dom";
import { addResidentFormHandler } from "@/form-handlers";
import { HostelSelector } from "../ui/HostelSelector";
import { validateResidentInput } from "@/lib/utilities";
import { LogOutIcon } from "lucide-react";

type HostelListData = Record<
    string,
    {
        name: string;
        isOld: boolean;
        toBeDeleted: boolean;
    }
>;

export function SuperuserPage(props: { metadata: DatabaseMetadata }) {
    const [hostelList, setHostelList] = useState<HostelListData>(
        Object.keys(props.metadata.hostels).reduce((prev, key) => {
            return {
                ...prev,
                [key]: { name: props.metadata.hostels[key], isOld: true, toBeDeleted: false },
            } as HostelListData;
        }, {})
    );

    return (
        <main className="flex flex-col p-8 max-w-screen-lg mx-auto space-y-8">
            <div className="space-y-2 select-none">
                <div>Logged in as</div>
                <div className="font-medium text-3xl">Superuser</div>
                <p>The superuser has access to some lower-level functionalities of the system. HANDLE WITH CARE.</p>
            </div>

            <HostelManageSection hostelList={hostelList} setHostelList={setHostelList} />

            <ResetInmatePasswordSection />

            <AddInmateSection hostels={props.metadata.hostels} />

            <DeleteInmateSection />

            <div className="hover:bg-black/5 rounded transition-all duration-150 ease-in-out">
                <a href={"/logout"}>
                    <div className="p-4 flex place-items-center justify-between select-none">
                        <div className="flex gap-4 place-items-center">
                            <LogOutIcon />
                            <div>
                                <div className="text-lg">Logout</div>
                                <div className="text-sm">Log out of your account.</div>
                            </div>
                        </div>
                        <div className="text-xl">&rarr;</div>
                    </div>
                </a>
            </div>
        </main>
    );
}

function HostelManageSection(props: {
    hostelList: HostelListData;
    setHostelList: Dispatch<SetStateAction<HostelListData>>;
}) {
    const [hostelInputName, setHostelInputName] = useState("");
    const [hostelInputId, setHostelInputId] = useState("");

    const [isUpdatingHostelList, setIsUpdatingHostelList] = useState(false);

    return (
        <section className="space-y-4 px-6 py-8 rounded-md border border-gray-300 bg-gray-50">
            <div>
                <h2 className="text-xl font-medium">Manage Hostels</h2>
                <p className="mb-2 text-black/60">Manage the list of hostels. You can add or remove hostels.</p>
                <p className="text-yellow-600 italic font-medium">
                    Removing a hostel from the list will not remove the inmates in that hostel to prevent accidental
                    data loss. Proceed with caution and verify your actions before applying.
                </p>
            </div>

            <div className="space-y-2">
                {Object.keys(props.hostelList).length === 0 ? (
                    <div>No hostels.</div>
                ) : (
                    <div>
                        <HostelList
                            hostelList={props.hostelList}
                            handleActionButton={(hostel) => {
                                props.setHostelList(
                                    Object.keys(props.hostelList).reduce((prev, key) => {
                                        return {
                                            ...prev,
                                            [key]: {
                                                name: props.hostelList[key].name,
                                                isOld: props.hostelList[key].isOld,
                                                toBeDeleted:
                                                    key === hostel
                                                        ? !props.hostelList[key].toBeDeleted
                                                        : props.hostelList[key].toBeDeleted,
                                            },
                                        } as HostelListData;
                                    }, {})
                                );
                            }}
                        />
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        className="border-2 rounded-sm w-full px-3 py-2"
                        placeholder="Hostel name"
                        value={hostelInputName}
                        onChange={(e) => setHostelInputName(e.currentTarget.value)}
                    />
                    <input
                        type="text"
                        className="border-2 rounded-sm px-3 py-2 w-full"
                        placeholder="Hostel ID"
                        value={hostelInputId}
                        onChange={(e) => setHostelInputId(e.currentTarget.value)}
                    />
                    <button
                        className="block cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-bold text-center uppercase px-3 py-3 rounded-md w-full sm:w-1/4"
                        onClick={() => {
                            const hostelId = hostelInputId.trim();
                            const hostelName = hostelInputName.trim();
                            if (hostelId.length === 0 || hostelName.length === 0) {
                                return toast.error("Invalid details.");
                            }
                            if (hostelId in props.hostelList) {
                                return toast.error("Hostel ID already exists.");
                            }
                            if (Object.values(props.hostelList).some((hostel) => hostel.name === hostelName)) {
                                return toast.error("Hostel name already exists.");
                            }

                            props.hostelList[hostelId] = {
                                name: hostelName,
                                isOld: false,
                                toBeDeleted: false,
                            };

                            setHostelInputId("");
                            setHostelInputName("");
                            props.setHostelList(props.hostelList);
                        }}
                    >
                        Add
                    </button>
                </div>
                <button
                    disabled={isUpdatingHostelList || isUnacceptableChanges(props.hostelList)}
                    className="w-full cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-semibold text-center px-3 py-3 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 shadow-inner"
                    onClick={() => {
                        if (isUpdatingHostelList || isUnacceptableChanges(props.hostelList)) {
                            return toast.error("Make some changes to apply.");
                        }

                        setIsUpdatingHostelList(true);

                        const updated = Object.keys(props.hostelList)
                            .filter((hostel) => !props.hostelList[hostel].toBeDeleted)
                            .reduce((prev, key) => {
                                return {
                                    ...prev,
                                    [key]: {
                                        name: props.hostelList[key].name,
                                        isOld: true,
                                        toBeDeleted: false,
                                    },
                                } as HostelListData;
                            }, {} as HostelListData);

                        updateHostels(
                            Object.keys(updated).reduce((prev, key) => {
                                return { ...prev, [key]: props.hostelList[key].name };
                            }, {})
                        )
                            .then(() => {
                                toast.success("Updated successfully");
                                props.setHostelList(updated);
                            })
                            .catch((err) => {
                                toast.error("Failed to update the list.");
                                props.setHostelList(props.hostelList);
                            })
                            .finally(() => setIsUpdatingHostelList(false));
                    }}
                >
                    {isUpdatingHostelList ? "Applying..." : "Apply changes"}
                </button>
            </div>
        </section>
    );
}

function HostelList(props: { hostelList: HostelListData; handleActionButton: (hostel: string) => void }) {
    return (
        <ul className="list-inside">
            {Object.keys(props.hostelList).map((hostel) => {
                return (
                    <HostelListItem
                        key={hostel}
                        hostelList={props.hostelList}
                        hostel={hostel}
                        handleActionButton={() => props.handleActionButton(hostel)}
                    />
                );
            })}
        </ul>
    );
}

function HostelListItem(props: { hostelList: HostelListData; hostel: string; handleActionButton: () => void }) {
    return (
        <li className="list-item w-full rounded-md" key={props.hostel}>
            <div className="flex justify-between gap-2 py-1">
                <div
                    className={clsx("flex border-2 px-4 py-3 w-full place-items-center", {
                        "border-green-800 bg-green-100":
                            !props.hostelList[props.hostel].isOld && !props.hostelList[props.hostel].toBeDeleted,
                        "border-red-800 bg-red-100": props.hostelList[props.hostel].toBeDeleted,
                    })}
                >
                    {props.hostelList[props.hostel].name} ({props.hostel})
                </div>

                <div
                    className="cursor-pointer flex bg-stone-200 rounded-sm px-4 place-items-center w-14 max-w-14 justify-center"
                    onClick={props.handleActionButton}
                >
                    {props.hostelList[props.hostel].toBeDeleted ? <span>&#10226;</span> : <span>&times;</span>}
                </div>
            </div>
        </li>
    );
}

function ResetInmatePasswordSection() {
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [password, setPassword] = useState("");
    const [hasEditedPassword, setHasEditedPassword] = useState(false);

    useEffect(() => {
        if (password.length == 0) setHasEditedPassword(false);
    }, [password]);

    const [isResettingPassword, setIsResettingPassword] = useState(false);

    return (
        <section className="space-y-4 px-6 py-8 rounded-md border border-gray-300 bg-gray-50">
            <div>
                <h2 className="text-xl font-medium">Reset Inmate Password</h2>
                <p className="mb-2 text-black/60">
                    Password for an inmate account can be reset by filling in the following details.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="number"
                    className="border-2 rounded-sm w-full px-3 py-2"
                    placeholder="Admission number"
                    value={admissionNumber}
                    onChange={(e) => {
                        setAdmissionNumber(e.currentTarget.value);
                        if (!hasEditedPassword) setPassword(e.currentTarget.value);
                    }}
                />
                <input
                    type="text"
                    className="border-2 rounded-sm w-full px-3 py-2"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.currentTarget.value);
                        setHasEditedPassword((state) => state === false);
                    }}
                />
            </div>
            <button
                disabled={isResettingPassword || admissionNumber.length === 0 || password.length === 0}
                className="w-full cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-semibold text-center px-3 py-3 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 shadow-inner"
                onClick={() => {
                    if (isResettingPassword) {
                        return toast.error("Already resetting the password.");
                    } else if (admissionNumber.length < 1) {
                        return toast.error("Invalid details.");
                    } else if (password.length < 6) {
                        return toast.error("New password too short.");
                    } else if (password.length > 32) {
                        return toast.error("New password too long.");
                    }

                    setIsResettingPassword(true);

                    resetPassword({
                        admission: admissionNumber,
                        password: password,
                    })
                        .then(() => {
                            toast.success("Resetted password successfully");
                            setAdmissionNumber(""), setPassword("");
                        })
                        .catch((err) => {
                            toast.error("Couldn't reset the password.");
                        })
                        .finally(() => setIsResettingPassword(false));
                }}
            >
                {isResettingPassword ? "Resetting..." : "Reset password"}
            </button>
        </section>
    );
}

function AddInmateSection(props: { hostels: Record<string, string> }) {
    const formElement = useRef<HTMLFormElement>(null);
    const [status, dispatch] = useFormState(addResidentFormHandler, { ok: false });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const { pending } = useFormStatus();

    function revalidateFields() {
        const form = formElement.current;
        if (form == null) return;

        const formData = new FormData(form);
        const name = formData.get("full-name")?.toString(),
            admission = formData.get("admission-no")?.toString(),
            hostel = formData.get("hostel")?.toString(),
            room = formData.get("room")?.toString();

        const validated = validateResidentInput({ name, admission, hostel, room }, { hostels: props.hostels });
        setValidationErrors(validated.errors);
    }

    useEffect(() => {
        if (status.ok) {
            formElement.current?.reset();
            toast.success("Registered successfully!");
        }
    }, [status]);

    return (
        <section className="space-y-4 px-6 py-8 rounded-md border border-gray-300 bg-gray-50">
            <div>
                <h2 className="text-xl font-medium">Register Resident</h2>
                <p className="mb-2 text-black/60">
                    New inmates can be registered by filling in the details. The password is set to the admission number
                    initially and it can be changed through the account settings.
                </p>
            </div>

            <form className="grid gap-3" autoComplete="off" ref={formElement} action={dispatch}>
                <div>
                    <input
                        className="border-2 rounded-sm w-full px-3 py-2"
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
                        maxLength={8}
                        minLength={2}
                        required
                        className="border-2 rounded-sm w-full px-3 py-2"
                        id="admission-no"
                        name="admission-no"
                        type="number"
                        placeholder="Admission number"
                        onChange={revalidateFields}
                    />
                </div>

                <div className="bg-white">
                    <HostelSelector onChange={revalidateFields} hostels={props.hostels} disabled={false} />
                </div>

                <div>
                    <input
                        maxLength={8}
                        minLength={2}
                        required
                        className="border-2 rounded-sm w-full px-3 py-2"
                        id="room"
                        name="room"
                        type="text"
                        placeholder="Room"
                        onChange={revalidateFields}
                    />
                </div>

                {!status.ok && status.error != null && status.error.length > 0 && (
                    <p className="font-bold text-red-700">{status.error}</p>
                )}

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

                <button
                    className="w-full cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-semibold text-center px-3 py-3 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 shadow-inner"
                    disabled={pending || validationErrors.length != 0}
                    aria-disabled={pending || validationErrors.length != 0}
                    onClick={
                        pending
                            ? () => {}
                            : (event) => {
                                  revalidateFields();
                                  if (validationErrors.length != 0) {
                                      event.preventDefault();
                                  }
                              }
                    }
                >
                    {pending ? "Registering..." : "Register inmate"}
                </button>
            </form>
        </section>
    );
}

function DeleteInmateSection() {
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [isDeletingInmate, setIsDeletingInmate] = useState(false);

    return (
        <section className="space-y-4 px-6 py-8 rounded-md border border-gray-300 bg-gray-50">
            <div>
                <h2 className="text-xl font-medium">Delete Inmate</h2>
                <p className="mb-2 text-black/60">
                    Hostel inmate data can be deleted from here.{" "}
                    <span className="text-red-700 italic font-medium">
                        This will also delete the preference data related to the inmate.
                    </span>
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="number"
                    className="border-2 rounded-sm w-full px-3 py-2"
                    placeholder="Admission number"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.currentTarget.value)}
                />
                <button
                    disabled={isDeletingInmate || admissionNumber.length === 0}
                    className="w-full cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-semibold text-center px-3 py-3 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 shadow-inner"
                    onClick={() => {
                        if (isDeletingInmate) {
                            return toast.error("Already processing...");
                        } else if (admissionNumber.length < 1) {
                            return toast.error("Invalid admission number.");
                        }

                        setIsDeletingInmate(true);

                        deleteResident({ admission: admissionNumber })
                            .then((data) => {
                                if (data.ok) {
                                    toast.success(data.message);
                                    setAdmissionNumber("");
                                } else {
                                    toast.error(data.message);
                                }
                            })
                            .catch((err) => {
                                toast.error("Couldn't delete the inmate data.");
                            })
                            .finally(() => setIsDeletingInmate(false));
                    }}
                >
                    {isDeletingInmate ? "Deleting..." : "Delete resident"}
                </button>
            </div>
        </section>
    );
}

function isUnacceptableChanges(hostelList: HostelListData) {
    return Object.keys(hostelList).every(
        (hostel) =>
            (!hostelList[hostel].isOld && hostelList[hostel].toBeDeleted) ||
            (hostelList[hostel].isOld && !hostelList[hostel].toBeDeleted)
    );
}
