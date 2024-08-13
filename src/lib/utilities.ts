import { HOSTELS, MEAL_TYPES } from "./constants";
import { MealStatus, MealType, MonthInfo, ResidentInput, UserType } from "./types";

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

export function userRedirectPath(type: UserType) {
    switch (type) {
        case "manager":
            return "/manager/dashboard";
        case "resident":
        default:
            return "/";
    }
}

export function validateResidentInput(fields: ResidentInput) {
    const errors: string[] = [];
    if (typeof fields.name !== "string" || fields.name.trim().length == 0) {
        errors.push("Invalid name");
    }
    if (
        typeof fields.admission !== "string" ||
        fields.admission.length !== 6 ||
        isNaN(Number.parseInt(fields.admission)) ||
        !/^2[0-9]{5}$/.test(fields.admission)
    ) {
        errors.push("Invalid admission number");
    }
    if (typeof fields.password !== "string") {
        errors.push("Invalid password");
    }
    if (typeof fields.confirmPassword !== "string" || fields.confirmPassword !== fields.password) {
        errors.push("Passwords doesn't match.");
    }
    if (fields.password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }
    if (fields.password.length > 32) {
        errors.push("Password must be at most 32 characters long");
    }
    if (!(fields.hostel in HOSTELS)) {
        errors.push("Invalid hostel name");
    }
    return {
        ok: errors.length > 0 ? false : true,
        errors,
    };
}
