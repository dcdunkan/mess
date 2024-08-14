"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarView } from "./ui/CalendarView";
import { MealEditorModal } from "./ui/MealEditorModal";
import { CookieSessionData, DayPreference, Resident } from "../lib/types";
import { getMonthInfo } from "../lib/utilities";
import { getResidentMarkings } from "@/lib/database";

interface PageProps {
    today: Date;
    sessionData: CookieSessionData<Resident>;
}

export default function HomePage(props: PageProps) {
    const [showEditor, setShowEditor] = useState(false);
    const [isEdtiableDate, setIsEditableDate] = useState(true);
    const [selectedMonth, setDate] = useState({
        year: props.today.getFullYear(),
        monthIndex: props.today.getMonth(),
    });
    const month = getMonthInfo(selectedMonth.year, selectedMonth.monthIndex + 1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isCalendarReady, setIsCalendarReady] = useState(false);
    const [calendarStatus, setCalendarStatus] = useState("Loading...");
    const [monthlyPreferences, setMonthlyPreferences] = useState<DayPreference[]>([]);

    useEffect(() => {
        getResidentMarkings(
            { month: selectedMonth.monthIndex, year: selectedMonth.year },
            { id: props.sessionData._id, hostel: props.sessionData.hostel }
        )
            .then((data) => {
                setMonthlyPreferences(data);
                setIsCalendarReady(true);
            })
            .catch((err) => setCalendarStatus("Failed to load calender."));
    }, [selectedMonth, selectedDate, props]);

    return (
        <main>
            <div className="flex flex-col p-8 max-w-screen-lg text-lg mx-auto space-y-10">
                <div>
                    <div className="flex place-items-center justify-between select-none my-4">
                        <h1 className="font-bold text-4xl">Hi, {props.sessionData.name}!</h1>
                        <a href={"/logout"}>
                            <div className="border-2 border-black px-2 py-1 hover:bg-black hover:text-white text-base">
                                Logout
                            </div>
                        </a>
                    </div>
                    <p className="text-justify text-pretty">
                        This is where you can opt-out from the future meals, if you prefer not to eat from the hostel
                        mess. Individual meals can also be opted-out from to reduce food wastage. Please do not attend
                        the mess if you have opted-out.
                    </p>
                </div>

                {/* <div>
                    <h3 className="text-2xl font-semibold">Weekly Overview</h3>
                    <p className="text-justify text-pretty">
                        Customize your meal preferences for the upcoming week.
                    </p>

                    <div className="grid grid-cols-1 divide-y divide-black w-full mt-4">
                        {new Array(7).fill(0).map((x, i) => {
                            let day = today.getDate() + i + 1;
                            let monthValue = today.getMonth() + 1;
                            let year = today.getFullYear();

                            if (day > month.days) {
                                const updatedMonthValue = (monthValue % 12) + 1;
                                if (updatedMonthValue < monthValue) year++;
                                monthValue = updatedMonthValue;
                                day -= month.days;
                            }

                            const weekDay = Intl.DateTimeFormat("en-US", {
                                weekday: "long",
                            }).format(new Date(year, monthValue - 1, day));

                            return (
                                <div
                                    key={i}
                                    className="grid grid-rows-1 grid-cols-6 gap-5 py-3 text-center"
                                >
                                    <div>
                                        {day.toString().padStart(2, "0")}/
                                        {monthValue.toString().padStart(2, "0")}
                                    </div>
                                    <div className="truncate">{weekDay}</div>
                                    <div>Breakfast</div>
                                    <div>Lunch</div>
                                    <div>Snacks</div>
                                    <div>Dinner</div>
                                </div>
                            );
                        })}
                    </div>
                </div> */}

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
                                    setDate(updated);
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
                                    setDate(updated);
                                }}
                            >
                                &rarr;
                            </span>
                        </div>
                    </div>
                    <p className="">Click a date to adjust your breakfast, lunch, or dinner preferences.</p>
                    {!isCalendarReady && <div className="text-center">{calendarStatus}</div>}
                    {isCalendarReady && (
                        <CalendarView
                            monthlyPreferences={monthlyPreferences}
                            monthInfo={month}
                            today={props.today}
                            onDateSelected={(date, { isPastDay }) => {
                                setSelectedDate(date);
                                setShowEditor(true);
                                setIsEditableDate(!isPastDay);
                            }}
                            selectedMonth={selectedMonth}
                        />
                    )}
                </div>

                <div>
                    <Link href={"/menu"}>
                        <div className="flex justify-between place-items-center p-6 border-black border bg-stone-100 hover:bg-stone-50 transition-all">
                            <div>
                                <div className="font-semibold text-xl">🍲 Checkout the food menu!</div>
                                <div className="text-lg">...and make suggestions or complaints.</div>
                            </div>
                            <div className="text-4xl">&rarr;</div>
                        </div>
                    </Link>
                </div>
            </div>

            {showEditor && selectedDate != null && (
                <MealEditorModal
                    editable={isEdtiableDate}
                    onClose={() => {
                        setShowEditor(false);
                        setSelectedDate(null);
                    }}
                    selectedDate={selectedDate}
                    sessionData={props.sessionData}
                />
            )}
        </main>
    );
}
