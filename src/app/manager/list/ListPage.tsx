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
    const [monthlyData, setMonthlyData] = useState<Record<string, number>>({});

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
                    <div className="w-full space-y-6">
                        <div className="flex justify-between place-items-center">
                            <div>
                                Showing page <b>{page}</b> of <b>{totalPages}</b>
                            </div>
                            <PageChanger page={page} setPage={setPage} totalPages={totalPages} />
                        </div>
                        <table className="text-center w-full  table-auto table">
                            <thead>
                                <tr>
                                    <th className="border font-semibold">Room</th>
                                    <th className="border font-semibold">Name</th>
                                    <th className="border font-semibold">Admission</th>
                                    <th className="border font-semibold">Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {residents
                                    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                                    .map((resident, i) => {
                                        return (
                                            <tr key={i}>
                                                <td className="border p-2">{resident.room}</td>
                                                <td className="border px-3 py-2 text-left">{resident.name}</td>
                                                <td className="border p-2">{resident.admission}</td>
                                                <td className="border p-2">
                                                    {month.days - (monthlyData[resident._id] ?? 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
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
            <div className="text-lg p-2 border">
                {page} / {totalPages}
            </div>
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
