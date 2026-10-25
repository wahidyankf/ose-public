---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Merpati Trading Co. is fictional, and every number in this course belongs to it. The company wholesales office supplies, extends credit to resellers, carries inventory in a rented warehouse, and must decide, this quarter, whether a new delivery van earns its price. Before that decision is an accounting entry, it is a time-value and a risk judgement: money today is worth more than money later, debt magnifies both gains and pain, and no valuation survives its assumptions. This course teaches that judgement with runnable arithmetic.

## Why this exists -- the big idea

**The problem before the solution**: `accounting-foundations` teaches how to record what already happened, but nothing in the catalog teaches the forward-looking finance judgements a business decision needs: discounting future cash, reading ratios, screening investments, pricing capital, and valuing a company. **Keep this if you forget everything else**: a dollar today is worth more than a dollar later, and every finance decision in this course is that one idea applied to a different question.

## What you will be able to do

After this course you can compute present and future value, including annuities, and explain what the discount rate represents; read a set of financial statements and compute profitability, liquidity, leverage, and efficiency ratios; evaluate an investment with net present value and internal rate of return and decide between them when they disagree; compute a weighted average cost of capital and explain how capital structure changes it; and produce a basic valuation estimate and state the assumptions it depends on.

## How this course is organized

[Learning](/en/learn/courses/corporate-finance-essentials/learning/overview) holds 48 worked examples in nine themes: [Theme A](/en/learn/courses/corporate-finance-essentials/learning/theme-a-time-value-of-money) (Examples 1-5) discounts and compounds cash flows, [Theme B](/en/learn/courses/corporate-finance-essentials/learning/theme-b-financial-statement-analysis) (Examples 6-10) reads the statements, [Theme C](/en/learn/courses/corporate-finance-essentials/learning/theme-c-profitability-and-liquidity-ratios) (Examples 11-15) measures earning power and short-term health, [Theme D](/en/learn/courses/corporate-finance-essentials/learning/theme-d-leverage-and-efficiency-ratios) (Examples 16-21) measures debt and asset use, [Theme E](/en/learn/courses/corporate-finance-essentials/learning/theme-e-capital-budgeting-npv-and-irr) (Examples 22-27) screens investments, [Theme F](/en/learn/courses/corporate-finance-essentials/learning/theme-f-cost-of-capital-and-wacc) (Examples 28-33) prices capital, [Theme G](/en/learn/courses/corporate-finance-essentials/learning/theme-g-capital-structure) (Examples 34-38) mixes debt and equity, [Theme H](/en/learn/courses/corporate-finance-essentials/learning/theme-h-valuation-basics) (Examples 39-43) values the firm simply, and [Theme I](/en/learn/courses/corporate-finance-essentials/learning/theme-i-sensitivity-and-judgement) (Examples 44-48) stresses every conclusion. The [capstone](/en/learn/courses/corporate-finance-essentials/learning/capstone/overview) evaluates one fictional expansion decision end to end, and [drilling](/en/learn/courses/corporate-finance-essentials/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: accounting-foundations for the three financial statements and their vocabulary, and just-enough-python because every example computes with Python 3.14's standard library. Assumed knowledge: basic algebra and the income statement, balance sheet, and cash-flow statement from accounting-foundations.

## About the examples

Every runnable example computes with Python 3.14's standard library only, using `decimal.Decimal` for every monetary amount so rounding is reproducible across runs: no floats touch money, no network call happens, and no clock is read. Merpati Trading Co. and every worked company in this course are fictional and labelled as such; the silent partner in every file is determinism, so two runs print byte-identical output.

## References

- Ross, Westerfield, and Jordan, Fundamentals of Corporate Finance, standard edition (time value of money, ratio families, NPV, IRR, WACC, and capital-structure intuition; the formulas in this course are textbook-stable). Accessed 2026-10-21.
- Brealey, Myers, and Allen, Principles of Corporate Finance (discounted cash flow valuation, cost of capital, and payout and leverage discussion). Accessed 2026-10-21.
- Accounting foundations vocabulary this course assumes: [accounting-foundations](/en/learn/courses/accounting-foundations/learning/overview) - accessed 2026-10-21; statement names and debit-credit mechanics come from that course, not from the legacy pages below.
- Legacy material this course migrates and re-verifies: corporate finance and business overview legacy pages - accessed 2026-10-21; every fact mined from those pages was re-checked against the textbooks above on the same date rather than copied as already correct.
