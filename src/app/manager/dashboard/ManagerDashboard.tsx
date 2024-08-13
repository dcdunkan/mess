"use client";

import { getNegativeMonthlyCount } from "@/lib/database";
import { CookieSessionData, DayData, Manager, MonthData } from "@/lib/types";
import { getMonthInfo } from "@/lib/utilities";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ManagerDashboardPageProps {
    sessionData: CookieSessionData<Manager>;
    today: Date;
    tomorrow: Date;
    tomorrowData: DayData;
    totalResidents: number;
}

export function ManagerDashboardPage(props: ManagerDashboardPageProps) {
    const [isLoadingMonthlyData, setIsLoadingMonthlyData] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState("Loading...");

    const [selectedMonth, setSelectedMonth] = useState({
        year: props.today.getFullYear(),
        monthIndex: props.today.getMonth(),
    });
    const month = getMonthInfo(selectedMonth.year, selectedMonth.monthIndex + 1);
    const [monthlyData, setMonthlyData] = useState<MonthData>({});

    useEffect(() => {
        getNegativeMonthlyCount(
            {
                date: { month: selectedMonth.monthIndex, year: selectedMonth.year },
                hostel: props.sessionData.user.hostel,
            },
            props.totalResidents
        )
            .then((data) => {
                setMonthlyData(data);
                setIsLoadingMonthlyData(false);
            })
            .catch((err) => setLoadingStatus("Failed to fetch."));
    }, [selectedMonth, props.sessionData, props.totalResidents]);

    const tomorrowDateDisplay = Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        weekday: "long",
    }).format(props.tomorrow);

    return (
        <main>
            <div className="flex flex-col p-8 max-w-screen-lg text-lg mx-auto space-y-10">
                <div>
                    <div className="flex place-items-center justify-between select-none my-4">
                        <div>
                            <div>Hostel</div>
                            <h1 className="font-bold text-4xl">{props.sessionData.user.hostel}</h1>
                        </div>
                        <div className="text-base">
                            <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white">
                                <Link href={"/logout"}>Logout</Link>
                            </div>
                        </div>
                    </div>
                    <p className="text-justify text-pretty">
                        You can see the counts for the future days right here on this page.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="font-medium text-base">Tomorrow</div>
                        <div className="text-2xl font-bold">{tomorrowDateDisplay}</div>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-1">
                        <MealCount count={props.tomorrowData.breakfast} label="Breakfast" />
                        <MealCount count={props.tomorrowData.lunch} label="Lunch" />
                        <MealCount count={props.tomorrowData.snacks} label="Snacks" />
                        <MealCount count={props.tomorrowData.dinner} label="Dinner" />
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
                                            data={
                                                monthlyData[day] ?? {
                                                    breakfast: props.totalResidents,
                                                    lunch: props.totalResidents,
                                                    snacks: props.totalResidents,
                                                    dinner: props.totalResidents,
                                                }
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </details>
                    )}

                    {!isLoadingMonthlyData &&
                        selectedMonth.monthIndex >= props.today.getMonth() && (
                            <div className="divide-y-2">
                                {new Array(month.days - props.today.getDate())
                                    .fill(0)
                                    .map((_, i) => {
                                        const day = props.today.getDate() + i + 1;
                                        return (
                                            <DayListItem
                                                key={day}
                                                day={day}
                                                month={selectedMonth.monthIndex}
                                                data={
                                                    monthlyData[day] ?? {
                                                        breakfast: props.totalResidents,
                                                        lunch: props.totalResidents,
                                                        snacks: props.totalResidents,
                                                        dinner: props.totalResidents,
                                                    }
                                                }
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

function DayListItem(props: { day: number; month: number; data: DayData }) {
    return (
        <div className="grid grid-cols-5 grid-rows-1 p-3 text-center">
            <div>
                {props.day.toString().padStart(2, "0")} / {props.month.toString().padStart(2, "0")}
            </div>
            <div>{props.data.breakfast}</div>
            <div>{props.data.lunch}</div>
            <div>{props.data.snacks}</div>
            <div>{props.data.dinner}</div>
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
