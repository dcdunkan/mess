"use client";

import { resetPassword, updateHostels } from "@/lib/database";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { DatabaseMetadata } from "@/lib/types";

type HostelList = Record<
    string,
    {
        name: string;
        isOld: boolean;
        toBeDeleted: boolean;
    }
>;

export function SuperuserPage(props: { metadata: DatabaseMetadata }) {
    const [hostelList, setHostelList] = useState<HostelList>(
        Object.keys(props.metadata.hostels).reduce((prev, key) => {
            return {
                ...prev,
                [key]: { name: props.metadata.hostels[key], isOld: true, toBeDeleted: false },
            } as HostelList;
        }, {})
    );

    return (
        <main className="flex flex-col p-8 max-w-screen-lg mx-auto space-y-10">
            <div className="space-y-1 select-none my-4">
                <div>Logged in as</div>
                <div className="font-medium text-3xl">Superuser</div>
                <p>The superuser has access to some lower-level functionalities of the system. HANDLE WITH CARE.</p>
            </div>

            <HostelManageSection hostelList={hostelList} setHostelList={setHostelList} />
            <ResetInmatePasswordSection />
        </main>
    );
}

function HostelManageSection(props: { hostelList: HostelList; setHostelList: Dispatch<SetStateAction<HostelList>> }) {
    const [hostelInputName, setHostelInputName] = useState("");
    const [hostelInputId, setHostelInputId] = useState("");

    const [isUpdatingHostelList, setIsUpdatingHostelList] = useState(false);

    return (
        <section>
            <fieldset className="border-2 border-black p-4">
                <legend className="text-xl font-medium px-2">Manage hostels</legend>

                <p className="mb-2 p-4 border-2 border-yellow-400 rounded bg-yellow-400/50">
                    <b>WARNING</b>: Removing a hostel from the list will not remove the inmates in that hostel to
                    prevent accidental data loss. Proceed with caution and verify your actions before applying.
                </p>

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
                                            } as HostelList;
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
                                    } as HostelList;
                                }, {} as HostelList);

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
            </fieldset>
        </section>
    );
}

function HostelList(props: { hostelList: HostelList; handleActionButton: (hostel: string) => void }) {
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

function HostelListItem(props: { hostelList: HostelList; hostel: string; handleActionButton: () => void }) {
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

function isUnacceptableChanges(hostelList: HostelList) {
    return Object.keys(hostelList).every(
        (hostel) =>
            (!hostelList[hostel].isOld && hostelList[hostel].toBeDeleted) ||
            (hostelList[hostel].isOld && !hostelList[hostel].toBeDeleted)
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
        <section>
            <fieldset className="border-2 border-black p-4 space-y-2">
                <legend className="text-xl px-2 font-medium">Reset inmate password</legend>
                <p className="mb-2 px-2">Hostel inmate password can be reset through here.</p>

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
                    disabled={isResettingPassword}
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
            </fieldset>
        </section>
    );
}
