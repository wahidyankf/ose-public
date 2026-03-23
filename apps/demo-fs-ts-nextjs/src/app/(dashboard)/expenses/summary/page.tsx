"use client";

import { useState } from "react";
import { usePLReport, useExpenseSummary } from "@/lib/queries/use-expenses";
import type { CategoryBreakdown } from "@/lib/api/types";

const SUPPORTED_CURRENCIES = ["USD", "IDR"];

function getDefaultDates(): { start: string; end: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0] ?? "";
  return { start: fmt(firstDay), end: fmt(now) };
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginBottom: "1.5rem",
};

function CategoryTable({ rows, title }: { rows: CategoryBreakdown[]; title: string }) {
  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: "#888" }}>No data for this period.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th
                style={{ padding: "0.6rem", textAlign: "left", fontWeight: "700", fontSize: "0.85rem", color: "#555" }}
              >
                Category
              </th>
              <th
                style={{ padding: "0.6rem", textAlign: "right", fontWeight: "700", fontSize: "0.85rem", color: "#555" }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.category}-${idx}`}
                style={{ borderBottom: "1px solid #eee", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}
              >
                <td style={{ padding: "0.6rem" }}>{row.category}</td>
                <td style={{ padding: "0.6rem", textAlign: "right", fontWeight: "500" }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ExpenseSummaryPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [currency, setCurrency] = useState("USD");
  const [submitted, setSubmitted] = useState(false);
  const [queryParams, setQueryParams] = useState({
    startDate: defaults.start,
    endDate: defaults.end,
    currency: "USD",
  });

  const { data, isLoading, isError } = usePLReport(
    submitted ? queryParams.startDate : "",
    submitted ? queryParams.endDate : "",
    submitted ? queryParams.currency : "",
  );

  const { data: summaryData } = useExpenseSummary();
  const summaryEntries =
    summaryData && typeof summaryData === "object" && !Array.isArray(summaryData)
      ? Object.entries(summaryData as Record<string, string>)
      : [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQueryParams({ startDate, endDate, currency });
    setSubmitted(true);
  };

  return (
    <>
      <h1 style={{ marginBottom: "1.5rem" }}>Expense Summary</h1>

      {summaryEntries.length > 0 && !submitted && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Total by Currency</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {summaryEntries.map(([cur, total]) => (
              <div
                key={cur}
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  padding: "1rem",
                  minWidth: "140px",
                  textAlign: "center",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>{cur}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#c0392b" }}>
                  {cur} {total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Filter</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <div>
            <label
              htmlFor="start-date"
              style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem" }}
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-required="true"
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem" }}
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-required="true"
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label
              htmlFor="currency"
              style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600", fontSize: "0.85rem" }}
            >
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.9rem" }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            style={{
              padding: "0.55rem 1.25rem",
              backgroundColor: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
            }}
          >
            Generate Report
          </button>
        </form>
      </div>

      {isLoading && <p>Generating report...</p>}

      {isError && (
        <p role="alert" style={{ color: "#c0392b" }}>
          Failed to load report. Please try again.
        </p>
      )}

      {data && (
        <div data-testid="pl-chart">
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Summary: {queryParams.currency} &mdash; {queryParams.startDate} to {queryParams.endDate}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
              {[
                { label: "Total Income", value: data.totalIncome, color: "#27ae60" },
                { label: "Total Expense", value: data.totalExpense, color: "#c0392b" },
                { label: "Net", value: data.net, color: parseFloat(data.net) >= 0 ? "#27ae60" : "#c0392b" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "1rem",
                    textAlign: "center",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>{label}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700", color }}>
                    {data.currency} {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CategoryTable title="Income Breakdown" rows={data.incomeBreakdown} />
          <CategoryTable title="Expense Breakdown" rows={data.expenseBreakdown} />
        </div>
      )}

      {!submitted && !isLoading && (
        <p style={{ color: "#888", textAlign: "center" }}>
          Select a date range and currency, then click Generate Report.
        </p>
      )}
    </>
  );
}
