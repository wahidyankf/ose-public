// AUTHORITATIVE FX SNAPSHOT — the single source for every USD conversion in the app.
//
// Values live in `libs/ayokoding-data/data/fx.json`; provenance in
// `libs/ayokoding-data/provenance.md`. This module keeps the original path and named
// exports; the JSON is the only declaration. A city's USD rate is DERIVED from this
// table via city.currency — no city stores its own rate.
import fxJson from "../../../../../../../libs/ayokoding-data/data/fx.json";

export type FxTable = {
  fxSnapshotDate: string; // ISO date of this FX snapshot
  ratesUsdPerUnit: Record<string, number>; // ISO-4217 -> USD value per 1 unit
};

export const fx: FxTable = fxJson as FxTable;

// ONLY conversion primitive — every *Usd function in calc.ts routes through this.
// Throws if the currency is not in the fx table, rather than returning NaN.
export function fxToUsd(fxTable: FxTable, currency: string): number {
  const rate = fxTable.ratesUsdPerUnit[currency];
  if (rate === undefined) {
    throw new Error(`Currency "${currency}" not found in fx table (fxSnapshotDate: ${fxTable.fxSnapshotDate})`);
  }
  return rate;
}

// Convenience: reads the rate for a city's own currency from the fx table.
export function cityFxToUsd(fxTable: FxTable, city: { currency: string }): number {
  return fxToUsd(fxTable, city.currency);
}

// Convert a USD amount to a chosen display currency.
// result = usd / fxToUsd(fx, displayCurrency)
export function usdToDisplay(fxTable: FxTable, usd: number, displayCurrency: string): number {
  const displayRate = fxToUsd(fxTable, displayCurrency);
  return usd / displayRate;
}
