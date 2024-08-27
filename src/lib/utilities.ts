import { MEAL_TYPES } from "./constants";
import { MealStatus, MealType, MonthInfo, Resident, UserType } from "./types";

export class ReasonedError extends Error {
    constructor(public reason: string) {
        super(reason);
    }
}

export function isMeal(value: string): value is MealType {
    return MEAL_TYPES.includes(value as MealType);
}

export function hasOptedIn(status: MealStatus) {
    return Object.keys(status).some((meal) => status[meal as MealType]);
}

export function getMonthInfo(year: number, month: number): MonthInfo {
    const currentMonthIndex = month - 1;
    const date = new Date(year, month, 0);
    const startDate = new Date(year, currentMonthIndex, 1);
    const prevMonthLastDate = new Date(year, currentMonthIndex, 0);

    return {
        year: year,
        name: date.toLocaleString("default", { month: "long" }),
        days: date.getDate(),
        startDate: startDate.getDay(),
        currentMonthIndex,
        prevMonthIndex: prevMonthLastDate.getMonth(),
        prevMonthLastDate: prevMonthLastDate.getDate(),
    };
}

export function isPastDay(
    date: Date,
    isPastOf: Date,
    // consider the (future) date as past.
    { includeToday = true }: { includeToday: boolean }
) {
    return date.getFullYear() < isPastOf.getFullYear()
        ? true
        : date.getFullYear() == isPastOf.getFullYear()
        ? date.getMonth() < isPastOf.getMonth()
            ? true
            : date.getMonth() == isPastOf.getMonth()
            ? (includeToday ? date.getDate() <= isPastOf.getDate() : date.getDate() < isPastOf.getDate())
                ? true
                : false
            : false
        : false;
}

export function userRedirectPath(type: UserType) {
    switch (type) {
        case "superuser":
            return "/superuser";
        case "manager":
            return "/manager";
        case "resident":
        default:
            return "/";
    }
}

export function displayName(name: string): string {
    return name
        .split(/\s+/)
        .map((part) => (part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
        .join(" ");
}

export function prepareDefaultMealCount(defaultCount: number) {
    return MEAL_TYPES.reduce((prev, meal) => ({ ...prev, [meal]: defaultCount }), {} as Record<MealType, number>);
}

export function organizeMonthlyData(monthlyData: { day: number; data: MealStatus[] }[]) {
    return monthlyData.reduce((prev, dayData) => {
        return {
            ...prev,
            [dayData.day]: organizeDayData(dayData),
        };
    }, {} as Record<number, Record<MealType, number>>);
}

export function organizeDayData({ data }: { day: number; data: MealStatus[] }) {
    return data.reduce((prev, status) => {
        for (const _meal in status) {
            const meal = _meal as MealType;
            prev[meal] += status[meal] ? 0 : 1;
        }
        return prev;
    }, prepareDefaultMealCount(0));
}

export function generateCSV(
    residents: Omit<Resident, "password">[],
    monthlyData: Record<string, number>,
    monthDays: number
) {
    return (
        `Room,Name,Admission No,Days\n` +
        residents
            .map((resident) =>
                [
                    // keep it formatted
                    resident.room,
                    resident.name,
                    resident.admission,
                    monthDays - (monthlyData[resident._id] ?? 0),
                ].join(",")
            )
            .join("\n")
    );
}
