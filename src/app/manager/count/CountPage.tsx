"use client";

import { getNegativeMonthlyCount, getTotalResidents } from "@/lib/database";
import { CookieSessionData, DayData, Manager, SelectedDate } from "@/lib/types";
import {
    getMonthInfo,
    isPastDay,
    organizeDayData,
    organizeMonthlyData,
    prepareDefaultMealCount,
} from "@/lib/utilities";
import { HostelSelectorModal } from "@/app/ui/HostelSelectorModal";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";
import Link from "next/link";

interface ManagerDashboardPageProps {
    today: Date;
    tomorrow: SelectedDate;
    sessionData: CookieSessionData<Manager>;
    hostelIds: string[];
    hostels: Record<string, string>;
}

export function ResidentListPage(props: ManagerDashboardPageProps) {
    const [isLoadingMonthlyData, setIsLoadingMonthlyData] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState("Loading...");

    const currentMonth = useMemo(() => {
        return {
            year: props.today.getFullYear(),
            monthIndex: props.today.getMonth(),
        };
    }, [props.today]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const month = getMonthInfo(selectedMonth.year, selectedMonth.monthIndex + 1);

    const [selectedHostel, setSelectedHostel] = useState(props.hostelIds?.[0] ?? "");
    const [totalResidents, setTotalResidents] = useState<number>(0);
    const [monthlyData, setMonthlyData] = useState<Record<number, DayData>>({});
    const [tomorrowData, setTomorrowData] = useState<DayData>(prepareDefaultMealCount(totalResidents));

    useEffect(() => {
        if (!props.hostelIds.includes(selectedHostel)) {
            return;
        }
        getNegativeMonthlyCount({
            date: { month: selectedMonth.monthIndex, year: selectedMonth.year },
            hostel: selectedHostel,
        })
            .then((data) => {
                setMonthlyData(organizeMonthlyData(data));
                setIsLoadingMonthlyData(false);
            })
            .catch((err) => setLoadingStatus("Failed to fetch."));
    }, [selectedMonth, selectedHostel, props.hostelIds]);

    useEffect(() => {
        getTotalResidents(selectedHostel)
            .then((total) => setTotalResidents(total))
            .catch((err) => toast.error("Failed to load count."));
    }, [selectedHostel]);

    useEffect(() => {
        getNegativeMonthlyCount({ date: props.tomorrow, hostel: selectedHostel })
            .then((data) => {
                setTomorrowData(data.length == 0 ? prepareDefaultMealCount(0) : organizeDayData(data[0]));
            })
            .catch((err) => toast.error("Failed to load count."));
    }, [props.tomorrow, selectedHostel]);

    const [showHostelSelector, setShowHostelSelector] = useState(false);

    if (!props.hostelIds.includes(selectedHostel))
        return (
            <main className="m-8 font-medium text-xl">
                <div>No hostels to manage!</div>
                <div>Login to superuser account to manage the hostel list.</div>
            </main>
        );

    const tomorrowDateDisplay = Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        weekday: "long",
    }).format(new Date(props.tomorrow.year, props.tomorrow.month, props.tomorrow.day));

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
                </section>

                <div className="space-y-6">
                    <div>
                        <div className="font-medium text-base">Tomorrow</div>
                        <div className="text-2xl font-bold">{tomorrowDateDisplay}</div>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-1">
                        <MealCount count={totalResidents - tomorrowData.breakfast} label="Breakfast" />
                        <MealCount count={totalResidents - tomorrowData.lunch} label="Lunch" />
                        <MealCount count={totalResidents - tomorrowData.snacks} label="Snacks" />
                        <MealCount count={totalResidents - tomorrowData.dinner} label="Dinner" />
                    </div>
                </div>

                <div className="w-full mx-auto flex flex-col space-y-4">
                    <div className="flex place-items-center justify-between select-none text-2xl">
                        <div>
                            <h2 className="text-xl">
                                {month.name} {month.year}
                            </h2>
                        </div>
                        <div className="inline-flex gap-6">
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

                    {isLoadingMonthlyData && <div>{loadingStatus}</div>}

                    {!isLoadingMonthlyData && (
                        <table>
                            <tr className="text-sm text-center">
                                <th className="border py-2 font-medium">Date</th>
                                <th className="border py-2 font-medium">Breakfast</th>
                                <th className="border py-2 font-medium">Lunch</th>
                                <th className="border py-2 font-medium">Snacks</th>
                                <th className="border py-2 font-medium">Dinner</th>
                            </tr>
                            {new Array(month.days).fill(0).map((_, i) => {
                                const day = i + 1;
                                return (
                                    <DayListItem
                                        today={props.today}
                                        key={day}
                                        day={day}
                                        monthInfo={selectedMonth}
                                        data={monthlyData[day] ?? prepareDefaultMealCount(0)}
                                        totalResidents={totalResidents}
                                    />
                                );
                            })}
                        </table>
                    )}
                </div>
            </main>
        </>
    );
}

function DayListItem(props: {
    day: number;
    today: Date;
    monthInfo: { monthIndex: number; year: number };
    data: DayData;
    totalResidents: number;
}) {
    const thisDate = new Date(props.monthInfo.year, props.monthInfo.monthIndex, props.day);
    const isPast = isPastDay(thisDate, props.today, { includeToday: false });
    const isToday =
        props.today.getDate() === props.day &&
        props.monthInfo.monthIndex === props.today.getMonth() &&
        props.monthInfo.year === props.today.getFullYear();

    return (
        <tr className={clsx("p-3 table-row text-center", { "opacity-40 bg-black/5": isPast, "font-bold": isToday })}>
            <td className="border py-2">{props.day.toString().padStart(2, "0")}</td>
            <td className="border py-2">{props.totalResidents - props.data.breakfast}</td>
            <td className="border py-2">{props.totalResidents - props.data.lunch}</td>
            <td className="border py-2">{props.totalResidents - props.data.snacks}</td>
            <td className="border py-2">{props.totalResidents - props.data.dinner}</td>
        </tr>
    );
}

function MealCount(props: { label: string; count: number }) {
    return (
        <div className="text-center">
            <div className="text-4xl font-bold">{props.count}</div>
            <div className="text-lg font-medium">{props.label}</div>
        </div>
    );
}

export function ChevronDownIcon({}: { fill?: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="size-5"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
    );
}
