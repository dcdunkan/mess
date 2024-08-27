"use client";

import { CookieSessionData, Manager, Resident } from "@/lib/types";
import Link from "next/link";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { HostelSelectorModal } from "@/app/ui/HostelSelectorModal";
import { generateCSV, getMonthInfo } from "@/lib/utilities";
import { getMonthlyHostelData, getResidentsList, getTotalResidents } from "@/lib/database";
import toast from "react-hot-toast";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import clsx from "clsx";

interface CountPageProps {
    sessionData: CookieSessionData<Manager>;
    today: Date;
    hostelIds: string[];
    hostels: Record<string, string>;
}

export function CountPage(props: CountPageProps) {
    const [isLoadingMonthlyData, setIsLoadingMonthlyData] = useState(true);

    const [selectedHostel, setSelectedHostel] = useState(props.hostelIds?.[0] ?? "");
    const [showHostelSelector, setShowHostelSelector] = useState(false);

    const currentMonth = useMemo(() => {
        return {
            year: props.today.getFullYear(),
            monthIndex: props.today.getMonth(),
        };
    }, [props.today]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [page, setPage] = useState(1);
    const [totalResidents, setTotalResidents] = useState(0);

    const month = getMonthInfo(selectedMonth.year, selectedMonth.monthIndex + 1);

    const totalPages = useMemo(() => Math.ceil(totalResidents / ITEMS_PER_PAGE), [totalResidents]);
    const [residents, setResidents] = useState<Omit<Resident, "password">[]>([]);
    const [monthlyData, setMonthlyData] = useState<Record<string, Record<number, boolean>>>({});

    useEffect(() => {
        getTotalResidents(selectedHostel)
            .then((count) => setTotalResidents(count))
            .catch(() => toast.error("Failed to fetch"));
    }, [selectedHostel]);

    useEffect(() => {
        getResidentsList({
            hostel: selectedHostel,
            page: page,
        })
            .then((residents) => setResidents(residents))
            .catch((err) => toast.error("Failed to get resident list"));
    }, [selectedHostel, page]);

    useEffect(() => {
        setIsLoadingMonthlyData(true);
        getMonthlyHostelData({
            date: { month: selectedMonth.monthIndex, year: selectedMonth.year },
            hostel: selectedHostel,
        })
            .then((data) => {
                setMonthlyData(data);
                setIsLoadingMonthlyData(false);
            })
            .catch((err) => toast.error("Failed to fetch data."));
    }, [selectedMonth, selectedHostel]);

    const arbitraryArray = useMemo(() => new Array(month.days).fill(0), [month.days]);

    return (
        <>
            {showHostelSelector && (
                <HostelSelectorModal
                    hostelIds={props.hostelIds}
                    hostels={props.hostels}
                    onClose={() => setShowHostelSelector(false)}
                    selectedHostel={selectedHostel}
                    onSelect={setSelectedHostel}
                />
            )}
            <main className="flex flex-col p-8 max-w-screen-lg mx-auto space-y-6">
                <section>
                    <Link href={"/manager"}>
                        <div className="font-medium text-lg">&larr; Go back</div>
                    </Link>
                </section>

                <section className="flex justify-between">
                    <div onClick={() => setShowHostelSelector(true)}>
                        <div>Viewing resident list of</div>
                        <div className="inline-flex gap-2">
                            <div className="font-semibold text-xl">{props.hostels[selectedHostel]}</div>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    <button
                        className="inline-flex gap-2 text-lg border px-4 py-2 h-fit bg-black text-white rounded-lg items-center justify-center text-center place-items-center"
                        onClick={() => {
                            const loadingToastId = toast.loading("Exporting data...");
                            const url = window.URL.createObjectURL(
                                new Blob([generateCSV(residents, monthlyData, month.days)])
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute(
                                "download",
                                `${selectedHostel}-${month.year}-${month.name.toLowerCase()}.csv`
                            );
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.dismiss(loadingToastId);
                        }}
                    >
                        <UploadIcon className="size-5" /> Export
                    </button>
                </section>

                <section>
                    <div>Use the buttons to switch between months.</div>
                    <div className="flex place-items-center justify-between select-none">
                        <div>
                            <h2 className="font-semibold text-xl">
                                {month.name} {month.year}
                            </h2>
                        </div>
                        <div className="inline-flex gap-6 text-2xl">
                            <span
                                className="cursor-pointer"
                                onClick={() => {
                                    const updated = { ...selectedMonth };
                                    updated.monthIndex--;
                                    if (updated.monthIndex < 0) {
                                        updated.year--;
                                        updated.monthIndex = 11;
                                    }
                                    setSelectedMonth(updated);
                                }}
                            >
                                &larr;
                            </span>
                            <span
                                className="cursor-pointer"
                                onClick={() => {
                                    const updated = { ...selectedMonth };
                                    updated.monthIndex++;
                                    if (updated.monthIndex > 11) {
                                        updated.year++;
                                        updated.monthIndex = 0;
                                    }
                                    setSelectedMonth(updated);
                                }}
                            >
                                &rarr;
                            </span>
                        </div>
                    </div>
                </section>

                {isLoadingMonthlyData && <div>Loading</div>}

                {!isLoadingMonthlyData && (
                    <div className="space-y-6">
                        <div className="flex justify-between place-items-center">
                            <div>
                                Showing page <b>{page}</b> of <b>{totalPages}</b>
                            </div>
                            <PageChanger page={page} setPage={setPage} totalPages={totalPages} />
                        </div>
                        <div className="overflow-scroll max-h-[85vh]">
                            <table className="text-center table-fixed table border-separate border-spacing-0">
                                <thead>
                                    <tr className="">
                                        <th className="border-t border-b border-l border-black px-3 py-1 font-semibold sticky top-0 z-10 bg-white">
                                            Room
                                        </th>
                                        <th className="border border-black px-3 py-1 font-semibold sticky top-0 left-0 z-20 bg-white">
                                            Name
                                        </th>
                                        <th className="border-t border-b border-r border-black px-3 py-1 font-semibold sticky top-0 z-10 bg-white">
                                            Admission
                                        </th>
                                        <th className="border-t border-b border-r border-black px-3 py-1 font-semibold sticky top-0 z-10 bg-white">
                                            Days
                                        </th>
                                        {arbitraryArray.map((_, i) => {
                                            return (
                                                <th
                                                    key={`day-${i}`}
                                                    className="border-t border-b border-r border-black px-3 py-1 font-semibold sticky top-0 z-10 bg-white"
                                                >
                                                    {i + 1}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {residents
                                        .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                                        .map((resident, i) => {
                                            return (
                                                <tr key={i} className="">
                                                    <td className="border-b border-l border-black px-3">
                                                        {resident.room}
                                                    </td>
                                                    <td className="border-b border-r border-l border-black px-3 py-2 text-left sticky z-10 left-0 bg-white whitespace-nowrap">
                                                        {resident.name}
                                                    </td>
                                                    <td className="border-b border-r border-black px-3">
                                                        {resident.admission}
                                                    </td>
                                                    <td className="border-b border-r border-black px-3">
                                                        {month.days -
                                                            (monthlyData[resident._id] != null
                                                                ? Object.values(monthlyData[resident._id]).reduce(
                                                                      (p, c) => p + (c ? 1 : 0),
                                                                      0
                                                                  )
                                                                : 0)}
                                                    </td>
                                                    {arbitraryArray.map((_, i) => {
                                                        const hasOptedOut = !!monthlyData[resident._id]?.[i + 1];
                                                        return (
                                                            <td
                                                                key={`day-${i}`}
                                                                className={clsx(
                                                                    "border-b border-r border-black px-3 py-1 font-semibold min-w-12 max-w-12",
                                                                    {
                                                                        "bg-red-300": hasOptedOut,
                                                                        "bg-green-50": !hasOptedOut,
                                                                    }
                                                                )}
                                                            >
                                                                {hasOptedOut ? (
                                                                    <span>&#10005;</span>
                                                                ) : (
                                                                    <span>&#10003;</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        <PageChanger page={page} setPage={setPage} totalPages={totalPages} />
                    </div>
                )}
            </main>
        </>
    );
}

function PageChanger({
    page,
    setPage,
    totalPages,
}: {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    totalPages: number;
}) {
    return (
        <div className="flex gap-2 justify-center">
            <button
                className="p-2 border rounded disabled:opacity-40 disabled:bg-black/30"
                disabled={page == 1}
                onClick={() => setPage((page) => (page - 1 < 1 ? page : page - 1))}
            >
                <ChevronLeftIcon />
            </button>
            <div className="text-lg p-2 border min-w-10 text-center">{page}</div>
            <button
                className="p-2 border rounded disabled:opacity-40 disabled:bg-black/30"
                disabled={page == totalPages}
                onClick={() => setPage((page) => (page + 1 > totalPages ? page : page + 1))}
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
}
