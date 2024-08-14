"use client";

import { updateHostels } from "@/lib/database";
import { useState } from "react";
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
    const [hostelInputName, setHostelInputName] = useState("");
    const [hostelInputId, setHostelInputId] = useState("");

    const [hostelList, setHostelList] = useState<HostelList>(
        Object.keys(props.metadata.hostels).reduce((prev, key) => {
            return {
                ...prev,
                [key]: { name: props.metadata.hostels[key], isOld: true, toBeDeleted: false },
            } as HostelList;
        }, {})
    );
    const [isUpdatingHostelList, setIsUpdatingHostelList] = useState(false);

    return (
        <main className="space-y-6 mx-auto max-w-screen-lg text-base">
            <div className="m-8">
                <div className="flex justify-between place-items-center">
                    <div className="text-3xl my-4 font-semibold">Superuser</div>

                    <a href={"/logout"}>
                        <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white text-base">
                            Logout
                        </div>
                    </a>
                </div>
                <fieldset className="border-2 border-black p-4">
                    <legend className="text-xl px-2 font-medium">Manage hostels</legend>

                    <div className="m-2 space-y-2">
                        {Object.keys(hostelList).length === 0 ? (
                            <div>No hostels.</div>
                        ) : (
                            <div>
                                <div>List of hostels:</div>
                                <HostelList
                                    hostelList={hostelList}
                                    handleActionButton={(hostel) => {
                                        setHostelList(
                                            Object.keys(hostelList).reduce((prev, key) => {
                                                return {
                                                    ...prev,
                                                    [key]: {
                                                        name: hostelList[key].name,
                                                        isOld: hostelList[key].isOld,
                                                        toBeDeleted:
                                                            key === hostel
                                                                ? !hostelList[key].toBeDeleted
                                                                : hostelList[key].toBeDeleted,
                                                    },
                                                } as HostelList;
                                            }, {})
                                        );
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
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
                                className="cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-bold text-center uppercase px-3 py-3 rounded-md w-1/4"
                                onClick={() => {
                                    const hostelId = hostelInputId.trim();
                                    const hostelName = hostelInputName.trim();
                                    if (hostelId.length === 0 || hostelName.length === 0) {
                                        return toast.error("Invalid details.");
                                    }
                                    if (hostelId in hostelList) {
                                        return toast.error("Hostel ID already exists.");
                                    }
                                    if (Object.values(hostelList).some((hostel) => hostel.name === hostelName)) {
                                        return toast.error("Hostel name already exists.");
                                    }

                                    hostelList[hostelId] = {
                                        name: hostelName,
                                        isOld: false,
                                        toBeDeleted: false,
                                    };

                                    setHostelInputId("");
                                    setHostelInputName("");
                                    setHostelList(hostelList);
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <button
                            disabled={isUpdatingHostelList || isUnacceptableChanges(hostelList)}
                            className="w-full cursor-pointer hover:bg-white hover:text-black border-black border-2 transition-all duration-200 bg-black text-white font-semibold text-center px-3 py-3 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-400 shadow-inner"
                            onClick={() => {
                                if (isUpdatingHostelList || isUnacceptableChanges(hostelList)) {
                                    return toast.error("Make some changes to apply.");
                                }

                                setIsUpdatingHostelList(true);

                                const updated = Object.keys(hostelList)
                                    .filter((hostel) => !hostelList[hostel].toBeDeleted)
                                    .reduce((prev, key) => {
                                        return {
                                            ...prev,
                                            [key]: {
                                                name: hostelList[key].name,
                                                isOld: true,
                                                toBeDeleted: false,
                                            },
                                        } as HostelList;
                                    }, {} as HostelList);

                                updateHostels(
                                    Object.keys(updated).reduce((prev, key) => {
                                        return { ...prev, [key]: hostelList[key].name };
                                    }, {})
                                )
                                    .then(() => {
                                        toast.success("Updated successfully");
                                        setHostelList(updated);
                                    })
                                    .catch((err) => {
                                        toast.error("Failed to update the list.");
                                        setHostelList(hostelList);
                                    })
                                    .finally(() => setIsUpdatingHostelList(false));
                            }}
                        >
                            {isUpdatingHostelList ? "Applying..." : "Apply changes"}
                        </button>
                    </div>
                </fieldset>
            </div>
        </main>
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
