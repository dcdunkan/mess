import { MealType } from "./types";

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

export const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"] as const;

export const MEALS: Record<MealType, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
};
