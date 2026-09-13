"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@open-sharia-enterprise/web-ui";
import type { Dataset, Household, City } from "../core/data/cities";
import type { Area, SchoolType } from "../core/calc";
import type { RoleMeta, RoleMatrix } from "../core/data/roles";
import {
  enumerateCityRoleEntries,
  minimumQualifyingRank,
  resolveBaselineUsd,
  toDisplayCurrencies,
} from "../core/role-lookup";
import type { CityRoleEntry } from "../core/role-lookup";
import { fx, fxToUsd } from "../core/data/fx";
import { DEFAULT_STATE } from "../core/url-state";
import type { MinRoleInputs, BaselineSource } from "../core/url-state";
import { fmtCurrencyTrailing } from "../core/format";
import { localeName, SelectField } from "./geo-filters";
import { SegmentedControl } from "./controls";
import { useDebouncedField, URL_INPUT_DEBOUNCE_MS } from "./use-debounced-field";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";

type EngRole = RoleMeta["role"];

// UWT-013: expand the bare "ic"/"mgmt" track codes to full localized words.
function trackLabel(track: string, locale: Locale): string {
  if (track === "ic") return t(locale, "trackIc");
  if (track === "mgmt") return t(locale, "trackMgmt");
  return track;
}

type Props = {
  dataset: Dataset;
  matrix: RoleMatrix;
  household: Household;
  schoolType: SchoolType;
  area: Area;
  cityScope: City[] | null;
  locale?: Locale;
  /** Shared generic filters, rendered after this tab's own baseline-source inputs. */
  filtersSlot?: ReactNode;
  /** Controlled baseline inputs. When provided with onInputsChange, the URL is the source of
      truth; otherwise the component falls back to internal state (legacy/standalone behaviour). */
  inputs?: MinRoleInputs;
  onInputsChange?: (next: MinRoleInputs) => void;
};

const DISPLAY_CURRENCIES = ["USD", "EUR", "SGD", "IDR", "GBP", "JPY", "CAD", "AED"];

export function MinRoleTable({
  dataset,
  matrix,
  household,
  schoolType,
  area,
  cityScope,
  locale = "en",
  filtersSlot,
  inputs,
  onInputsChange,
}: Props) {
  // Controlled (URL-driven) when `inputs` is supplied; otherwise internal state.
  const controlled = inputs !== undefined;
  const [internal, setInternal] = useState<MinRoleInputs>(() => ({ ...DEFAULT_STATE.minRole }));
  const s = controlled ? inputs : internal;
  const update = (patch: Partial<MinRoleInputs>) => {
    const next = { ...s, ...patch };
    if (controlled) onInputsChange?.(next);
    else setInternal(next);
  };

  // Derive the legacy local names + setters from the controlled/internal object so the rest of
  // the component body is unchanged. City ids resolve null → the first dataset city.
  const baselineSource = s.baselineSource;
  const setBaselineSource = (v: BaselineSource) => update({ baselineSource: v });
  // UWT-006 / EWT-001 reconciliation: we keep the RAW input string separately from the parsed
  // numeric amount so we can tell "the user has not entered a target yet" (blank `targetRaw` →
  // empty-state) apart from "the user explicitly typed 0" (`targetRaw === "0"` → baseline engaged,
  // every role clears, divider renders). Relying on `targetAmount === 0` alone cannot distinguish
  // these two states because both parse to the number 0.
  const setTargetRaw = (v: string) => update({ targetRaw: v });
  const targetCurrency = s.targetCurrency;
  const setTargetCurrency = (v: string) => update({ targetCurrency: v });
  const refCityId = s.refCityId ?? dataset.cities[0]?.id ?? "";
  const setRefCityId = (v: string) => update({ refCityId: v });
  const refRole = s.refRole as EngRole;
  const setRefRole = (v: EngRole) => update({ refRole: v });
  const setMyGrossMonthly = (v: number) => update({ myGrossMonthly: v });
  const mySalaryCityId = s.mySalaryCityId ?? dataset.cities[0]?.id ?? "";
  const setMySalaryCityId = (v: string) => update({ mySalaryCityId: v });
  // The gross-salary input can be entered in the salary city's local currency or in USD.
  const myGrossCurrency = s.myGrossCurrency;
  const setMyGrossCurrency = (v: "local" | "usd") => update({ myGrossCurrency: v });
  const displayCurrency = s.displayCurrency;
  const setDisplayCurrency = (v: string) => update({ displayCurrency: v });

  // Continuous text inputs (savings target, my gross) echo locally and debounce their URL
  // commit so typing stays smooth while the URL remains the source of truth. The LOCAL echo
  // (`*.value`) drives both the input AND every downstream derivation below, so the ranked
  // ladder updates live as the user types; only the URL write is deferred until typing
  // settles. In the uncontrolled/standalone path the commit is synchronous (delay 0),
  // preserving the original immediate behaviour. See useDebouncedField for the full rationale.
  const inputDebounceMs = controlled ? URL_INPUT_DEBOUNCE_MS : 0;
  const targetField = useDebouncedField(s.targetRaw, setTargetRaw, inputDebounceMs);
  const myGrossField = useDebouncedField<number>(s.myGrossMonthly, setMyGrossMonthly, inputDebounceMs);

  // UWT-006 / EWT-001 reconciliation: keep the RAW input string separate from the parsed
  // numeric amount so "no target entered yet" (blank `targetRaw` → empty-state) is
  // distinguishable from "explicitly typed 0" (`targetRaw === "0"` → baseline engaged, every
  // role clears, divider renders). Both parse to the number 0, so `targetAmount === 0` alone
  // cannot tell them apart. Driven by the live echo so the ladder reacts as the user types.
  const targetRaw = targetField.value;
  const targetAmount = parseFloat(targetRaw) || 0;
  const targetIsBlank = targetRaw.trim() === "";
  const myGrossMonthly = myGrossField.value;

  // Currency of the selected salary city; the "local" input option follows this.
  const mySalaryCity = dataset.cities.find((c) => c.id === mySalaryCityId);
  const mySalaryCityCurrency = mySalaryCity?.currency ?? "USD";
  // Normalise the entered gross to USD for ranking. A USD-currency city has no distinct local
  // option, so it is always treated as USD regardless of the toggle.
  const myGrossUsd =
    myGrossCurrency === "usd" || mySalaryCityCurrency === "USD"
      ? myGrossMonthly
      : myGrossMonthly * fxToUsd(fx, mySalaryCityCurrency);

  const opts = { household, schoolType, area };

  let baselineUsd = 0;
  let baselineReady = false;

  try {
    if (baselineSource === "savings_target" && !targetIsBlank && targetAmount >= 0) {
      baselineUsd = resolveBaselineUsd(
        "savings_target",
        { amountLocal: targetAmount, displayCurrency: targetCurrency },
        opts,
        dataset,
        matrix,
      );
      baselineReady = true;
    } else if (baselineSource === "reference_role" && refCityId) {
      baselineUsd = resolveBaselineUsd(
        "reference_role",
        { role: refRole as EngRole, cityId: refCityId },
        opts,
        dataset,
        matrix,
      );
      baselineReady = true;
    } else if (baselineSource === "my_salary" && myGrossMonthly > 0 && mySalaryCityId) {
      baselineUsd = resolveBaselineUsd(
        "my_salary",
        { grossMonthlyUsd: myGrossUsd, cityId: mySalaryCityId },
        opts,
        dataset,
        matrix,
      );
      baselineReady = true;
    }
  } catch {
    baselineReady = false;
  }

  // INCLUDE-ALL: every (city in scope) × role is a candidate row — no per-role argmax collapse.
  // As long as a place clears the bar and passes the geo filter, it appears. Until a baseline is
  // engaged we pass an unreachable bar so nothing "clears" and the full set renders as muted
  // context (the savings-target blank case is handled separately by the empty-state below).
  const entries = enumerateCityRoleEntries(dataset, opts, matrix, cityScope, baselineReady ? baselineUsd : Infinity);
  const minRank = baselineReady ? minimumQualifyingRank(entries) : null;
  // Flat list, sorted by essential savings (best money first), split by the bar.
  const bySavingsDesc = (a: CityRoleEntry, b: CityRoleEntry) => b.essentialSavingsUsd - a.essentialSavingsUsd;
  const qualifying = entries.filter((e) => e.clears).sort(bySavingsDesc);
  // Below-bar rows are OPTIONAL near-miss context (the include-all rule only governs qualifying
  // rows, which are never capped). Show just the handful CLOSEST to the bar — without a geo filter
  // there can be hundreds of deeply-negative pairs, and dumping them all is noise (and slow). The
  // hidden remainder is surfaced as a count so nothing is silently dropped.
  const NON_QUALIFYING_PREVIEW = 12;
  const nonQualifyingAll = entries.filter((e) => !e.clears).sort(bySavingsDesc);
  const nonQualifying = nonQualifyingAll.slice(0, NON_QUALIFYING_PREVIEW);
  const nonQualifyingHidden = nonQualifyingAll.length - nonQualifying.length;
  const noQualifiers = baselineReady && qualifying.length === 0;
  // An entry is "the minimum role" when it clears at the lowest qualifying seniority rank. Several
  // cities can share that rank — each is a valid lowest-seniority way to clear, so all are marked.
  const isMinEntry = (e: CityRoleEntry) => e.clears && minRank !== null && e.rank === minRank;

  // EWT-001: the qualifying divider anchors the qualifying group whenever a baseline is engaged and
  // at least one role qualifies — including the numeric zero-target case where EVERY role clears and
  // `nonQualifying` is empty. (Previously the divider required `nonQualifying.length > 0`, so at
  // target 0 it disappeared even though the qualifying group was non-empty.) Single source of truth
  // for both the desktop table and the mobile cards below.
  const showDivider = baselineReady && qualifying.length > 0;

  // UWT-006: when the savings-target baseline is selected but the target field is BLANK (the user
  // has not stated a goal yet), suppress the role ladder and show empty-state guidance instead of
  // dumping the full table. A numeric zero (`targetRaw === "0"`) is NOT blank — it engages the
  // baseline and renders the ladder/divider via the Phase-1 EWT-001 path above.
  const showEmptyState = baselineSource === "savings_target" && targetIsBlank;

  function DualCell({
    usdVal,
    cityCurrency,
    column,
    className,
  }: {
    usdVal: number;
    cityCurrency: string;
    column: string;
    className?: string;
  }) {
    const conv = toDisplayCurrencies(fx, usdVal, cityCurrency, displayCurrency);
    return (
      <TableCell
        data-testid="dual-currency-cell"
        data-money-column={column}
        data-usd={usdVal}
        data-display-currency={displayCurrency}
        data-local-currency={cityCurrency}
        className={className}
      >
        <span data-line="display">{fmtCurrencyTrailing(conv.display, displayCurrency)}</span>
        <span data-line="local" className="block text-xs text-muted-foreground">
          {fmtCurrencyTrailing(conv.localAmount, cityCurrency)}
        </span>
      </TableCell>
    );
  }

  function SavingsCell({ entry }: { entry: CityRoleEntry }) {
    const conv = toDisplayCurrencies(fx, entry.essentialSavingsUsd, entry.city.currency, displayCurrency);
    return (
      <TableCell
        data-testid="savings-triple"
        data-money-column="essential-savings"
        data-usd={entry.essentialSavingsUsd}
        data-display-currency={displayCurrency}
        data-local-currency={entry.city.currency}
      >
        {displayCurrency !== "USD" && (
          <span data-line="display">{fmtCurrencyTrailing(conv.display, displayCurrency)}</span>
        )}
        <span data-line="local" className="block text-xs text-muted-foreground">
          {fmtCurrencyTrailing(conv.localAmount, entry.city.currency)}
        </span>
        <span data-line="usd" className="block text-xs">
          {fmtCurrencyTrailing(entry.essentialSavingsUsd, "USD")}
        </span>
      </TableCell>
    );
  }

  function RoleRow({ entry, isMin, dimmed }: { entry: CityRoleEntry; isMin: boolean; dimmed: boolean }) {
    const rowLabel = matrix.ladder.find((r) => r.role === entry.role)?.label.en ?? entry.role;
    return (
      <TableRow
        data-testid={dimmed ? "non-qualifying-row" : undefined}
        data-candidate-row="true"
        data-city-id={entry.city.id}
        data-country-id={entry.country.id}
        data-currency={entry.city.currency}
        data-role={entry.role}
        data-rank={entry.rank}
        data-essential-savings-usd={entry.essentialSavingsUsd}
        className={dimmed ? "opacity-50" : undefined}
      >
        <TableCell>
          {rowLabel}
          {isMin && (
            <span data-testid="minimum-marker" className="ml-1 text-xs font-bold">
              {t(locale, "minimumMarker")}
            </span>
          )}
        </TableCell>
        <TableCell className="hidden lg:table-cell">{trackLabel(entry.track, locale)}</TableCell>
        <TableCell data-testid="city-cell">
          {localeName(entry.city.name, locale)}, {localeName(entry.country.name, locale)}
          {(entry.confidence === "proxy" || entry.confidence === "moderate") && (
            <span data-testid="confidence-flag" className="ml-1 text-xs text-muted-foreground">
              [{entry.confidence}]
            </span>
          )}
        </TableCell>
        <DualCell
          usdVal={entry.distributionUsd.p25}
          cityCurrency={entry.city.currency}
          column="p25"
          className="hidden lg:table-cell"
        />
        <DualCell usdVal={entry.distributionUsd.median} cityCurrency={entry.city.currency} column="median" />
        <DualCell
          usdVal={entry.distributionUsd.p75}
          cityCurrency={entry.city.currency}
          column="p75"
          className="hidden lg:table-cell"
        />
        <SavingsCell entry={entry} />
        <DualCell
          usdVal={entry.nonSalaryCompUsd}
          cityCurrency={entry.city.currency}
          column="non-salary-comp"
          className="hidden lg:table-cell"
        />
        <DualCell
          usdVal={entry.totalCompUsd}
          cityCurrency={entry.city.currency}
          column="total-comp"
          className="hidden lg:table-cell"
        />
      </TableRow>
    );
  }

  function MobileRoleCard({ entry, isMin, dimmed }: { entry: CityRoleEntry; isMin: boolean; dimmed: boolean }) {
    const rowLabel = matrix.ladder.find((r) => r.role === entry.role)?.label.en ?? entry.role;
    const med = toDisplayCurrencies(fx, entry.distributionUsd.median, entry.city.currency, displayCurrency);
    const sav = toDisplayCurrencies(fx, entry.essentialSavingsUsd, entry.city.currency, displayCurrency);
    return (
      <div className={`overflow-hidden rounded-lg border bg-card shadow-sm ${dimmed ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-3 py-2 text-primary-foreground">
          <span className="font-semibold">
            {rowLabel}
            {isMin && <span className="ml-1 text-xs font-bold">{t(locale, "minimumMarker")}</span>}
          </span>
          <span className="text-xs text-primary-foreground/80">{trackLabel(entry.track, locale)}</span>
        </div>
        <div className="space-y-1 p-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">{t(locale, "colCity")}</span>
            <span>
              {localeName(entry.city.name, locale)}, {localeName(entry.country.name, locale)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">{t(locale, "colMedian")}</span>
            <span className="tabular-nums">{fmtCurrencyTrailing(med.display, displayCurrency)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t pt-1.5 font-medium">
            <span className="text-muted-foreground">{t(locale, "colEssentialSavings")}</span>
            <span className="tabular-nums">{fmtCurrencyTrailing(sav.display, displayCurrency)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Shared field styling — keeps the baseline-source inputs visually consistent with the
  // cost + savings tab controls (labelled, bordered, 44px touch targets) instead of bare HTML.
  const fieldRow = "flex flex-wrap items-end gap-3";
  const fieldGroup = "flex flex-col gap-1";
  const fieldLabel = "text-sm font-medium text-foreground";
  const fieldControl =
    "min-h-[44px] rounded-md border border-border bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <div className="space-y-4">
      {/* Baseline source */}
      <div className="space-y-1">
        <p className={fieldLabel}>{t(locale, "labelBaselineSource")}</p>
        <SegmentedControl
          label={t(locale, "labelBaselineSource")}
          value={baselineSource}
          onChange={(v) => setBaselineSource(v)}
          options={[
            { value: "savings_target" as const, label: t(locale, "optSavingsTarget") },
            { value: "reference_role" as const, label: t(locale, "optReferenceRole") },
            { value: "my_salary" as const, label: t(locale, "optMySalary") },
          ]}
        />
        {/* Plain-language explanation of the selected baseline source — clarifies what each
            option means (esp. "Match a role") without forcing the user to infer it. */}
        <p data-testid="baseline-source-hint" className="text-sm text-muted-foreground">
          {t(
            locale,
            baselineSource === "savings_target"
              ? "hintSavingsTarget"
              : baselineSource === "reference_role"
                ? "hintReferenceRole"
                : "hintMySalary",
          )}
        </p>
      </div>

      {/* Savings target inputs */}
      {baselineSource === "savings_target" && (
        <div className={fieldRow}>
          <div className={fieldGroup}>
            <label htmlFor="target-amount-input" className={fieldLabel}>
              {t(locale, "labelMonthlySavingsTarget")}
            </label>
            <input
              id="target-amount-input"
              type="number"
              className={fieldControl}
              aria-label={t(locale, "labelMonthlySavingsTarget")}
              value={targetField.value}
              onChange={(e) => targetField.onChange(e.target.value)}
              onBlur={targetField.flush}
            />
          </div>
          <div className={fieldGroup}>
            <label htmlFor="target-currency-select" className={fieldLabel}>
              {t(locale, "labelTargetCurrency")}
            </label>
            <SelectField
              id="target-currency-select"
              ariaLabel={t(locale, "labelTargetCurrency")}
              value={targetCurrency}
              className="w-28"
              onChange={setTargetCurrency}
            >
              {DISPLAY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      )}

      {/* Reference role inputs */}
      {baselineSource === "reference_role" && (
        <div className={fieldRow}>
          <div className={fieldGroup}>
            <label htmlFor="ref-city-select" className={fieldLabel}>
              {t(locale, "labelRefCity")}
            </label>
            <SelectField
              id="ref-city-select"
              ariaLabel={t(locale, "labelRefCity")}
              value={refCityId}
              className="w-48"
              onChange={setRefCityId}
            >
              {dataset.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {localeName(c.name, locale)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className={fieldGroup}>
            <label htmlFor="ref-role-select" className={fieldLabel}>
              {t(locale, "labelRefRole")}
            </label>
            <SelectField
              id="ref-role-select"
              ariaLabel={t(locale, "labelRefRole")}
              value={refRole}
              className="w-48"
              onChange={(v) => setRefRole(v as EngRole)}
            >
              {matrix.ladder.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label.en}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      )}

      {/* My salary inputs */}
      {baselineSource === "my_salary" && (
        <div className={fieldRow}>
          <div className={fieldGroup}>
            <label htmlFor="my-gross-input" className={fieldLabel}>
              {t(locale, "labelMyGrossMonthly")}
            </label>
            <input
              id="my-gross-input"
              type="number"
              className={fieldControl}
              aria-label={t(locale, "labelMyGrossMonthly")}
              value={myGrossField.value || ""}
              onChange={(e) => myGrossField.onChange(parseFloat(e.target.value) || 0)}
              onBlur={myGrossField.flush}
            />
          </div>
          {/* Currency toggle — the gross can be entered in the salary city's local currency
              (which follows the selected city) or in USD. Hidden when the city is already USD. */}
          {mySalaryCityCurrency !== "USD" && (
            <div className={fieldGroup}>
              {/* A real <label> (not a bare span) gives the field column a deterministic height
                  matching the sibling input/select columns, so the toggle bottom-aligns in the
                  items-end field row (DWT-007). It labels the segmented group, which carries its
                  own aria-label, so no htmlFor association is required. */}
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={fieldLabel}>{t(locale, "labelSalaryInputCurrency")}</label>
              <SegmentedControl<"local" | "usd">
                label={t(locale, "labelSalaryInputCurrency")}
                value={myGrossCurrency}
                onChange={setMyGrossCurrency}
                options={[
                  { value: "local", label: mySalaryCityCurrency },
                  { value: "usd", label: "USD" },
                ]}
              />
            </div>
          )}
          <div className={fieldGroup}>
            <label htmlFor="my-city-select" className={fieldLabel}>
              {t(locale, "labelMySalaryCity")}
            </label>
            <SelectField
              id="my-city-select"
              ariaLabel={t(locale, "labelMySalaryCity")}
              value={mySalaryCityId}
              className="w-48"
              onChange={setMySalaryCityId}
            >
              {dataset.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {localeName(c.name, locale)}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      )}

      {/* Display currency */}
      <div className={fieldGroup}>
        <label htmlFor="display-currency-select" className={fieldLabel}>
          {t(locale, "labelDisplayCurrency")}
        </label>
        <SelectField
          id="display-currency-select"
          ariaLabel={t(locale, "labelDisplayCurrency")}
          value={displayCurrency}
          className="w-28"
          onChange={setDisplayCurrency}
        >
          {DISPLAY_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Notes */}
      <p data-testid="rank-basis-note" className="text-xs text-muted-foreground">
        {t(locale, "rankBasisNote")}
      </p>
      <p data-testid="non-salary-rank-note" className="text-xs text-muted-foreground">
        {t(locale, "nonSalaryRankNote")}
      </p>

      {/* Shared generic filters follow this tab's own baseline-source inputs. */}
      {filtersSlot}

      {/* No qualifiers message */}
      {noQualifiers && <p data-testid="no-qualifier-message">{t(locale, "noQualifierMessage")}</p>}

      {/* UWT-006: blank savings target → guidance instead of the role ladder. */}
      {showEmptyState && (
        <p data-testid="min-role-empty-state" className="py-6 text-center text-sm text-muted-foreground">
          {t(locale, "minRoleEmptyStateMessage")}
        </p>
      )}

      {/* Tablet + desktop (md+): table. Track / P25 / P75 / non-salary columns collapse on tablet. */}
      {baselineReady && (
        <div
          data-testid="min-role-table"
          data-baseline-usd={baselineUsd}
          data-min-rank={minRank ?? ""}
          className="hidden overflow-x-auto md:block"
        >
          <Table>
            <TableCaption data-testid="se-roles-caption">{t(locale, "seRolesCaption")}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t(locale, "colRole")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t(locale, "colTrack")}</TableHead>
                <TableHead>{t(locale, "colCity")}</TableHead>
                <TableHead className="hidden lg:table-cell" title={t(locale, "tooltipP25")}>
                  {t(locale, "colP25")}
                </TableHead>
                <TableHead title={t(locale, "tooltipMedian")}>{t(locale, "colMedian")}</TableHead>
                <TableHead className="hidden lg:table-cell" title={t(locale, "tooltipP75")}>
                  {t(locale, "colP75")}
                </TableHead>
                <TableHead>{t(locale, "colEssentialSavings")}</TableHead>
                {/* Narrow + wrap this verbose info header (overrides TableHead's default
                    whitespace-nowrap) so the long "Non-salary comp (info, annual, RSU/equity)"
                    label folds to ~2 lines instead of stretching the column. The body values are
                    short ("15,000 USD"), so a narrow column is fine. */}
                <TableHead
                  className="hidden w-48 whitespace-normal lg:table-cell"
                  title={t(locale, "tooltipNonSalaryComp")}
                >
                  {t(locale, "colNonSalaryCompInfo")}
                </TableHead>
                <TableHead className="hidden w-40 whitespace-normal lg:table-cell">
                  {t(locale, "colTotalComp")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifying.map((entry) => (
                <RoleRow
                  key={`${entry.city.id}:${entry.role}`}
                  entry={entry}
                  isMin={isMinEntry(entry)}
                  dimmed={false}
                />
              ))}

              {showDivider && (
                <TableRow data-testid="qualifying-divider">
                  <TableCell colSpan={9} className="text-center text-xs text-muted-foreground">
                    {t(locale, "qualifyingDivider")}
                  </TableCell>
                </TableRow>
              )}

              {nonQualifying.map((entry) => (
                <RoleRow key={`${entry.city.id}:${entry.role}`} entry={entry} isMin={false} dimmed={true} />
              ))}

              {nonQualifyingHidden > 0 && (
                <TableRow data-testid="non-qualifying-more">
                  <TableCell colSpan={9} className="text-center text-xs text-muted-foreground">
                    +{nonQualifyingHidden} {t(locale, "moreBelowBar")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile (<md): stacked role cards (qualifying first, divider, then dimmed below-minimum) */}
      {baselineReady && (
        <div data-testid="mobile-role-cards" className="space-y-3 md:hidden">
          {qualifying.map((entry) => (
            <MobileRoleCard
              key={`${entry.city.id}:${entry.role}`}
              entry={entry}
              isMin={isMinEntry(entry)}
              dimmed={false}
            />
          ))}

          {showDivider && (
            <p data-testid="qualifying-divider-mobile" className="text-center text-xs text-muted-foreground">
              {t(locale, "qualifyingDivider")}
            </p>
          )}

          {nonQualifying.map((entry) => (
            <MobileRoleCard key={`${entry.city.id}:${entry.role}`} entry={entry} isMin={false} dimmed={true} />
          ))}

          {nonQualifyingHidden > 0 && (
            <p data-testid="non-qualifying-more-mobile" className="text-center text-xs text-muted-foreground">
              +{nonQualifyingHidden} {t(locale, "moreBelowBar")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
