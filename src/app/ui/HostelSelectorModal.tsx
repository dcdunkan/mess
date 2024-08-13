"use client";

import clsx from "clsx";

interface HostelSelectorModalProps {
    onClose: () => void;
    selectedHostel: string;
    hostelIds: string[];
    hostels: Record<string, string>;
    onSelect: (selection: string) => void;
}

export function HostelSelectorModal(props: HostelSelectorModalProps) {
    return (
        <div
            className="z-[1] w-full h-full left-0 top-0 fixed overflow-auto bg-black bg-opacity-20 transition-all ease-in"
            onClick={props.onClose}
        >
            <div
                className="bg-white border-2 bottom-0 w-full fixed m-auto border-black"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex flex-col max-w-screen-md mx-auto p-8 text-base space-y-6">
                    <div className="flex justify-between text-2xl font-bold my-2">
                        <div>Choose hostel</div>
                        <div className="cursor-pointer" onClick={props.onClose}>
                            &times;
                        </div>
                    </div>
                    <div className="">
                        {props.hostelIds.map((id, i) => {
                            return (
                                <div
                                    key={i}
                                    className={clsx("border-2 p-4 px-6", {
                                        "rounded-t-lg": i === 0,
                                        "rounded-b-lg": i === props.hostelIds.length - 1,
                                        "bg-blue-50 border-blue-500": id === props.selectedHostel,
                                    })}
                                    onClick={() => props.onSelect(id)}
                                >
                                    {props.hostels[id]} <span className="text-gray-400">({id})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
