import { Effect } from "effect";
import { ValidationError } from "./errors.js";
import { CURRENCY_DECIMALS, isSupportedCurrency } from "./types.js";

export type ExpenseType = "EXPENSE" | "INCOME";

export interface Expense {
  readonly id: string;
  readonly userId: string;
  readonly type: ExpenseType;
  readonly amount: number;
  readonly currency: string;
  readonly description: string;
  readonly quantity: string | null;
  readonly unit: string | null;
  readonly date: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateExpenseData {
  readonly userId: string;
  readonly type: ExpenseType;
  readonly amount: number;
  readonly currency: string;
  readonly description: string;
  readonly quantity?: string;
  readonly unit?: string;
  readonly date: string;
}

export const SUPPORTED_UNITS = ["liter", "kilogram", "meter", "gallon", "pound", "foot", "mile", "ounce"] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export function isSupportedUnit(value: string): value is SupportedUnit {
  return SUPPORTED_UNITS.includes(value as SupportedUnit);
}

export const validateAmount = (currency: string, amount: number): Effect.Effect<number, ValidationError> => {
  const upperCurrency = currency.toUpperCase();
  if (!isSupportedCurrency(upperCurrency)) {
    return Effect.fail(
      new ValidationError({
        field: "currency",
        message: `Unsupported currency: ${currency}`,
      }),
    );
  }
  if (amount < 0) {
    return Effect.fail(
      new ValidationError({
        field: "amount",
        message: "Amount must not be negative",
      }),
    );
  }
  const decimals = CURRENCY_DECIMALS[upperCurrency];
  const factor = Math.pow(10, decimals);
  if (Math.round(amount * factor) !== amount * factor) {
    return Effect.fail(
      new ValidationError({
        field: "amount",
        message: `${currency} requires ${decimals} decimal places`,
      }),
    );
  }
  return Effect.succeed(amount);
};

export const validateUnit = (unit: string): Effect.Effect<string, ValidationError> => {
  if (!isSupportedUnit(unit)) {
    return Effect.fail(
      new ValidationError({
        field: "unit",
        message: `Unsupported unit: ${unit}. Supported units: ${SUPPORTED_UNITS.join(", ")}`,
      }),
    );
  }
  return Effect.succeed(unit);
};
