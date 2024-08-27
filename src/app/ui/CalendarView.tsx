import clsx from "clsx";
import { SelectedMonth, MonthInfo, DayPreference, MealType } from "../../lib/types";
import { MEAL_TYPES } from "@/lib/constants";
import { isPastDay } from "@/lib/utilities";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type DateSelectionHandler = (date: Date, options: { isPastDay: boolean }) => void;

export function CalendarView(props: {
    today: Date;
    tomorrow: Date;
    monthInfo: MonthInfo;
    selectedMonth: SelectedMonth;
    onDateSelected: DateSelectionHandler;
    monthlyPreferences: DayPreference[];
}) {
    const rowsNeeded = Math.ceil((props.monthInfo.startDate + props.monthInfo.days) / 7);
    return (
        <table className="w-full text-center justify-center place-items-cente text-xl select-none table-fixed">
            <tbody>
                <CalendarHeader headers={WEEKDAYS} />
                {new Array(rowsNeeded).fill(0).map((_, i) => {
                    return (
                        <tr key={i}>
                            <CalendarWeek weekIndex={i} {...props} />
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function CalendarHeader({ headers }: { headers: string[] }) {
    return (
        <tr className="bg-stone-300 text-sm">
            {headers.map((day, i) => (
                <th key={i} className="border p-1.5">
                    {day}
                </th>
            ))}
        </tr>
    );
}

function CalendarWeek({
    monthInfo,
    onDateSelected,
    selectedMonth,
    today,
    weekIndex,
    tomorrow,
    monthlyPreferences,
}: {
    weekIndex: number;
    monthInfo: MonthInfo;
    today: Date;
    tomorrow: Date;
    selectedMonth: SelectedMonth;
    onDateSelected: DateSelectionHandler;
    monthlyPreferences: DayPreference[];
}) {
    return new Array(7).fill(0).map((_, j) => {
        let thisDay = weekIndex * 7 + j + 1 - monthInfo.startDate;
        let inaccessible = thisDay < 1 || thisDay > monthInfo.days;

        // should be asserted before modifying the calculated day:
        const isToday =
            today.getDate() === thisDay &&
            selectedMonth.monthIndex == today.getMonth() &&
            selectedMonth.year === today.getFullYear();

        const isTomorrow =
            tomorrow.getDate() === thisDay &&
            selectedMonth.monthIndex == tomorrow.getMonth() &&
            selectedMonth.year === tomorrow.getFullYear();

        if (thisDay < 1) {
            thisDay = monthInfo.prevMonthLastDate - monthInfo.startDate + j + 1;
        } else if (thisDay > monthInfo.days) {
            thisDay -= monthInfo.days;
        }

        const thisDate = new Date(selectedMonth.year, selectedMonth.monthIndex, thisDay);

        let isPastModifiableTime =
            // is yesterday
            isPastDay(thisDate, today, { includeToday: true }) ||
            // or is tomorrow, and if today's time is past 22:00, then nope
            (today.getHours() >= 22 && isPastDay(thisDate, tomorrow, { includeToday: true }));

        const preference = monthlyPreferences.find(
            ({ date }) =>
                date.day === thisDay && date.month === selectedMonth.monthIndex && date.year === selectedMonth.year
        );
        const preferredMealCount =
            preference == null
                ? MEAL_TYPES.length
                : Object.keys(preference.meals).filter((meal) => preference.meals[meal as MealType]).length;
        const preferenceLevel = (preferredMealCount / MEAL_TYPES.length) * 100;

        return (
            <td
                key={j}
                className={clsx("border table-cell cursor-pointer transition-all duration-150 hover:opacity-20", {
                    "bg-stone-100 text-base font-extralight": inaccessible,
                    "text-xl font-medium": !inaccessible,
                    "!font-black border-black border-2": isToday,
                    "border-black/20 border-2": isTomorrow,
                    "opacity-50": isPastModifiableTime,
                    "bg-red-400": preferenceLevel === 0,
                    "bg-red-300": preferenceLevel > 10 && preferenceLevel < 30,
                    "bg-red-200": preferenceLevel >= 30 && preferenceLevel < 60,
                    "bg-red-100": preferenceLevel >= 60 && preferenceLevel < 100,
                })}
            >
                <button
                    className="size-full py-3 sm:py-4"
                    onClick={() => onDateSelected(thisDate, { isPastDay: isPastModifiableTime })}
                >
                    {thisDay}
                </button>
            </td>
        );
    });
}
