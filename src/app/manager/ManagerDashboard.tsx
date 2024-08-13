"use client";

import { getNegativeMonthlyCount, getTotalResidents } from "@/lib/database";
import { CookieSessionData, DayData, Manager, SelectedDate } from "@/lib/types";
import { getMonthInfo, organizeDayData, organizeMonthlyData, prepareDefaultMealCount } from "@/lib/utilities";
import { HostelSelectorModal } from "@/app/ui/HostelSelectorModal";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ManagerDashboardPageProps {
    today: Date;
    tomorrow: SelectedDate;
    sessionData: CookieSessionData<Manager>;
    hostelIds: string[];
    hostels: Record<string, string>;
}

export function ManagerDashboardPage(props: ManagerDashboardPageProps) {
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
        <main>
            {showHostelSelector && (
                <HostelSelectorModal
                    hostelIds={props.hostelIds}
                    hostels={props.hostels}
                    onClose={() => setShowHostelSelector(false)}
                    selectedHostel={selectedHostel}
                    onSelect={setSelectedHostel}
                />
            )}
            <div className="flex flex-col p-8 max-w-screen-lg text-lg mx-auto space-y-10">
                <div>
                    <div className="flex place-items-center justify-between select-none my-4">
                        <div>
                            <div
                                className="text-4xl font-bold inline-flex gap-2 place-items-center"
                                onClick={() => setShowHostelSelector(true)}
                            >
                                <div>{props.hostels[selectedHostel]}</div>
                                <div>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <p className="text-sm">Click to change hostel.</p>
                        </div>

                        <Link href={"/logout"}>
                            <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white text-base">
                                Logout
                            </div>
                        </Link>
                    </div>
                    {/* <p className="justify text-pretty">
                        You can see the counts for the future days right here on this page.
                    </p> */}
                </div>

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
                            <h2 className="font-semibold">
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

                    <div className="border-b-2 grid grid-cols-5 grid-rows-1 text-sm text-center uppercase font-bold text-stone-500">
                        <div>Date</div>
                        <div>Breakfast</div>
                        <div>Lunch</div>
                        <div>Snacks</div>
                        <div>Dinner</div>
                    </div>

                    {!isLoadingMonthlyData && props.today.getDate() > 1 && (
                        <details>
                            <summary className="text-zinc-600 font-medium select-none cursor-pointer">
                                Past days of the month
                            </summary>
                            <div className="divide-y-2 divide-stone-300  border-b-2">
                                {new Array(props.today.getDate()).fill(0).map((_, i) => {
                                    const day = i + 1;
                                    return (
                                        <DayListItem
                                            key={day}
                                            day={day}
                                            month={selectedMonth.monthIndex}
                                            data={monthlyData[day] ?? prepareDefaultMealCount(0)}
                                            totalResidents={totalResidents}
                                        />
                                    );
                                })}
                            </div>
                        </details>
                    )}

                    {!isLoadingMonthlyData && selectedMonth.monthIndex >= props.today.getMonth() && (
                        <div className="divide-y-2">
                            {new Array(month.days - props.today.getDate()).fill(0).map((_, i) => {
                                const day = props.today.getDate() + i + 1;
                                return (
                                    <DayListItem
                                        key={day}
                                        day={day}
                                        month={selectedMonth.monthIndex}
                                        data={monthlyData[day] ?? prepareDefaultMealCount(0)}
                                        totalResidents={totalResidents}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function DayListItem(props: { day: number; month: number; data: DayData; totalResidents: number }) {
    return (
        <div className="grid grid-cols-5 grid-rows-1 p-3 text-center">
            <div>
                {props.day.toString().padStart(2, "0")} / {props.month.toString().padStart(2, "0")}
            </div>
            <div>{props.totalResidents - props.data.breakfast}</div>
            <div>{props.totalResidents - props.data.lunch}</div>
            <div>{props.totalResidents - props.data.snacks}</div>
            <div>{props.totalResidents - props.data.dinner}</div>
        </div>
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
