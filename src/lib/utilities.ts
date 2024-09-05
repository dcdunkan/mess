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
    monthlyData: Record<string, Record<number, boolean>>,
    monthDays: number
) {
    const daysArray = new Array(monthDays).fill(0);
    return (
        [
            // for formatting
            "Room",
            "Name",
            "Admission No",
            "Days",
            ...daysArray.map((_, i) => i + 1),
        ].join(",") +
        "\n" +
        residents
            .map((resident) =>
                [
                    resident.room,
                    resident.name,
                    resident.admission,
                    monthDays -
                        (monthlyData[resident._id] != null
                            ? Object.values(monthlyData[resident._id]).reduce((p, c) => p + (c ? 1 : 0), 0)
                            : 0),
                    ...daysArray.map((_, i) => {
                        const hasOptedOut = !!monthlyData[resident._id]?.[i + 1];
                        return hasOptedOut ? 0 : 1;
                    }),
                ].join(",")
            )
            .join("\n")
    );
}

export function validateResidentInput(
    fields: {
        name?: string;
        admission?: string;
        hostel?: string;
        room?: string;
    },
    options: { hostels: Record<string, string> }
) {
    const errors: string[] = [];
    if (typeof fields.name !== "string" || fields.name.trim().length == 0) {
        errors.push("Invalid name");
    }
    if (
        typeof fields.admission !== "string" ||
        fields.admission.length < 3 ||
        fields.admission.length > 32 ||
        isNaN(Number.parseInt(fields.admission)) ||
        !/^[0-9]+$/.test(fields.admission)
    ) {
        errors.push("Invalid admission number");
    }
    if (fields.hostel == null || !(fields.hostel in options.hostels)) {
        errors.push("Invalid hostel name");
    }
    if (
        fields.room == null ||
        typeof fields.room !== "string" ||
        fields.room.length > 10 ||
        fields.room.length < 2 ||
        !/\d/.test(fields.room)
    ) {
        errors.push("Invalid room number");
    }

    return { ok: errors.length == 0, errors };
}
