"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarView } from "./ui/CalendarView";
import { MealEditorModal } from "./ui/MealEditorModal";
import { CookieSessionData, DayPreference, Resident } from "../lib/types";
import { displayName, getMonthInfo } from "../lib/utilities";
import { getResidentMarkings } from "@/lib/database";
import { LogOutIcon, SoupIcon, UserCogIcon } from "lucide-react";

interface PageProps {
    today: Date;
    tomorrow: Date;
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
            { id: props.sessionData.user._id, hostel: props.sessionData.user.hostel }
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
                        <div>
                            <p>Logged in as</p>
                            <div className="font-medium text-3xl">{displayName(props.sessionData.user.name)}</div>
                        </div>
                    </div>
                    <p className="text-justify text-pretty">
                        This is where you can opt-out from the future meals, if you prefer not to eat from the hostel
                        mess. Individual meals can also be opted-out from to reduce food wastage. Please do not attend
                        the mess if you have opted-out.
                    </p>
                </div>

                <div className="w-full mx-auto flex flex-col space-y-4">
                    <div className="flex place-items-center justify-between select-none text-2xl">
                        <div>
                            <h2 className="text-2xl">
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

                    <p>
                        Click a future date to adjust your breakfast, lunch, or dinner preferences. You can also review
                        your past preferences by clicking the past days.
                    </p>

                    {!isCalendarReady && <div className="text-center">{calendarStatus}</div>}
                    {isCalendarReady && (
                        <CalendarView
                            tomorrow={props.tomorrow}
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

                <div className="text-base">
                    <div className="hover:bg-black/5 rounded transition-all duration-200">
                        <Link href={"/account"}>
                            <div className="p-4 flex place-items-center justify-between select-none">
                                <div className="flex gap-4 place-items-center">
                                    <UserCogIcon />
                                    <div>
                                        <div className="text-xl">Account Settings</div>
                                        <div>Review information, change password.</div>
                                    </div>
                                </div>
                                <div className="text-xl">&rarr;</div>
                            </div>
                        </Link>
                    </div>
                    <div className="hover:bg-red-400/40 rounded transition-all duration-200">
                        <a href={"/logout"}>
                            <div className="p-4 flex place-items-center justify-between select-none">
                                <div className="flex gap-4 place-items-center">
                                    <LogOutIcon />
                                    <div>
                                        <div className="text-xl">Logout</div>
                                        <div>Log out of your account.</div>
                                    </div>
                                </div>
                                <div className="text-xl">&rarr;</div>
                            </div>
                        </a>
                    </div>
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
