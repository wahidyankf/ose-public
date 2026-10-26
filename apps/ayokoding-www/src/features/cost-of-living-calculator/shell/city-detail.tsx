"use client";

import type { Dataset, Household } from "../core/data/cities";
import type { Area, SchoolType } from "../core/calc";
import {
  childcareLocal,
  essentialsLocal,
  expensesLocal,
  liquidityReserveLocal,
  liquidityReserveUsd,
  relocationSunkLocal,
  relocationSunkUsd,
  scaleAmount,
  schoolLocal,
} from "../core/calc";
import { fmtCurrency, fmtDualCurrency, healthcareBadgeHue } from "../core/format";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { Badge } from "@open-sharia-enterprise/web-ui";
import { ForeignerSchoolFlag } from "./foreigner-school-flag";

function Row({
  label,
  value,
  testId,
  emphasis,
  rawValue,
}: {
  label: string;
  value: string;
  testId: string;
  emphasis?: "subtotal" | "total";
  rawValue?: number;
}) {
  const cls =
    emphasis === "total"
      ? "flex items-baseline justify-between border-t pt-2 text-base font-semibold"
      : emphasis === "subtotal"
        ? "flex items-baseline justify-between border-t pt-2 font-medium"
        : "flex items-baseline justify-between";
  return (
    <div className={cls}>
      <span className="text-muted-foreground">{label}</span>
      <span data-testid={testId} data-raw={rawValue} className="tabular-nums">
        {value}
      </span>
    </div>
  );
}

type Props = {
  dataset: Dataset;
  cityId: string;
  household: Household;
  schoolType: SchoolType;
  area: Area;
  locale?: Locale;
  backHref?: string;
};

function healthcareBadgeLabel(type: "oop" | "tax-funded" | "mixed", locale: Locale): string {
  if (type === "oop") return t(locale, "healthcareOutOfPocket");
  if (type === "tax-funded") return t(locale, "healthcareTaxFunded");
  return t(locale, "healthcareMandatoryPayroll");
}

export function CityDetail({ dataset, cityId, household, schoolType, area, locale = "en", backHref }: Props) {
  const city = dataset.cities.find((c) => c.id === cityId);
  if (!city) return <p>City not found.</p>;

  const country = dataset.countries.find((c) => c.id === city.countryId);
  if (!country) return <p>Country not found.</p>;
  const cur = city.currency;

  const e = city.expenses;
  const housingAmt = scaleAmount(e.housing.amount, "housing", household, area);
  const foodAmt = scaleAmount(e.food.amount, "food", household, area);
  const transportAmt = scaleAmount(e.transport.amount, "transport", household, area);
  const utilitiesAmt = scaleAmount(e.utilities.amount, "utilities", household, area);
  const healthcareAmt = scaleAmount(e.healthcare.amount, "healthcare", household, area);
  const childcareAmt = childcareLocal(city, household);
  const schoolAmt = schoolLocal(city, country, household, schoolType);
  // When "public" is selected but this country isn't fully open to foreign residents, the figure
  // above is actually the private one (effectiveSchoolType fell back) — annotate the label.
  const schoolForeignerFallback =
    schoolType === "public" && household.schoolKids > 0 && country.foreignerPublicSchool.access !== "open";
  const essentials = essentialsLocal(city, country, household, schoolType, area);
  const monthlyTotal = expensesLocal(city, country, household, schoolType, area);
  const relocationSunk = relocationSunkLocal(city);
  const relocationSunkInUsd = relocationSunkUsd(city, dataset.fx);
  const liquidityReserve = liquidityReserveLocal(city);
  const liquidityReserveInUsd = liquidityReserveUsd(city, dataset.fx);

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Colored header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex flex-col">
          <h2 className="text-lg leading-tight font-semibold">
            {city.name[locale] ?? city.name.en}
            {country ? `, ${country.name[locale] ?? country.name.en}` : ""}
          </h2>
          <a
            href={backHref ?? "?tab=cost"}
            data-back-link="true"
            className="text-sm text-primary-foreground/80 underline hover:text-primary-foreground"
          >
            {t(locale, "backToAllCities")}
          </a>
        </div>
        {country && (
          <Badge
            data-testid="healthcare-badge"
            variant="outline"
            hue={healthcareBadgeHue(country.healthcareModelType)}
            className="border-white/40 bg-white/15 text-white normal-case"
          >
            {healthcareBadgeLabel(country.healthcareModelType, locale)}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="space-y-4 p-4">
        <section aria-label={t(locale, "sectionMonthlyExpenses")} className="space-y-1.5 text-sm">
          <h2 className="text-sm font-semibold">{t(locale, "sectionMonthlyExpenses")}</h2>
          <Row
            label={t(locale, "labelHousing")}
            value={fmtCurrency(housingAmt, cur)}
            testId="expense-housing"
            rawValue={housingAmt}
          />
          <Row
            label={t(locale, "labelFood")}
            value={fmtCurrency(foodAmt, cur)}
            testId="expense-food"
            rawValue={foodAmt}
          />
          <Row
            label={t(locale, "labelTransport")}
            value={fmtCurrency(transportAmt, cur)}
            testId="expense-transport"
            rawValue={transportAmt}
          />
          <Row
            label={t(locale, "labelUtilities")}
            value={fmtCurrency(utilitiesAmt, cur)}
            testId="expense-utilities"
            rawValue={utilitiesAmt}
          />
          <Row
            label={t(locale, "labelHealthcareOOP")}
            value={fmtCurrency(healthcareAmt, cur)}
            testId="expense-healthcare"
            rawValue={healthcareAmt}
          />
          <Row
            label={t(locale, "labelChildcare")}
            value={fmtCurrency(childcareAmt, cur)}
            testId="expense-childcare"
            rawValue={childcareAmt}
          />
          <Row
            label={t(locale, "labelSchool")}
            value={fmtCurrency(schoolAmt, cur)}
            testId="expense-school"
            rawValue={schoolAmt}
          />
          {schoolForeignerFallback && (
            <div className="flex justify-end">
              <ForeignerSchoolFlag cityId={city.id} locale={locale} />
            </div>
          )}
          <Row
            label={t(locale, "labelEssentialsSubtotal")}
            value={fmtCurrency(essentials, cur)}
            testId="essentials-subtotal"
            emphasis="subtotal"
            rawValue={essentials}
          />
          <Row
            label={t(locale, "colLifestyle")}
            value={fmtCurrency(e.lifestyle.amount, cur)}
            testId="expense-lifestyle"
            rawValue={e.lifestyle.amount}
          />
          <Row
            label={t(locale, "labelMonthlyTotal")}
            value={fmtCurrency(monthlyTotal, cur)}
            testId="monthly-total"
            emphasis="total"
          />
        </section>

        <section aria-label={t(locale, "sectionRelocationCosts")} className="space-y-1.5 border-t pt-3 text-sm">
          <h2 className="text-sm font-semibold">{t(locale, "sectionRelocationCosts")}</h2>
          <Row
            label={t(locale, "labelRelocationSunkCost")}
            value={fmtDualCurrency(relocationSunk, cur, relocationSunkInUsd)}
            testId="relocation-sunk"
          />
          <Row
            label={t(locale, "labelLiquidityReserve")}
            value={fmtDualCurrency(liquidityReserve, cur, liquidityReserveInUsd)}
            testId="liquidity-reserve"
          />
        </section>
      </div>
    </div>
  );
}
