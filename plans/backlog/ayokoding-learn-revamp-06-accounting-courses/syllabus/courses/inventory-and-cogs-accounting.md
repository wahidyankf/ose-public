# Inventory and COGS Accounting (By Example)

**Course ID**: `inventory-and-cogs-accounting` · **Format**: By Example.

**Scope note**: Builds an inventory valuation engine in Python: perpetual records, cost layers, FIFO
and weighted-average costing, landed costs, cost of goods sold, write-downs to net realizable value,
counts, standard costs, ownership transfer, and the valuation tie-out. It excludes warehouse
operations and ERP inventory processes (covered by the ERP path) and cost allocation theory
(`managerial-and-cost-accounting`).

**Short summary**: The cost of what you sold depends on which units you say you sold. You build the
cost-layer engine that decides that, posts cost of goods sold on every shipment, and writes stock
down when it is worth less than it cost.

## Why this exists · the big idea

- **The problem before the solution**: an inventory module that tracks quantities but not cost layers
  gets margins wrong, allows negative stock, and cannot explain the inventory balance on the balance
  sheet.
- **Keep-this-if-you-forget-everything**: every unit in stock carries a cost layer; every movement
  moves cost as well as quantity; and the valuation report must tie to the ledger.

## Learning objectives

- Run a perpetual inventory with cost layers and post cost of goods sold on shipment.
- Compute FIFO and weighted-average costs and explain why IFRS forbids LIFO.
- Capitalize landed costs and handle returns, counts, and shrinkage.
- Write inventory down to net realizable value and reverse the write-down when allowed.
- Use standard costs with purchase price variances.
- Produce a valuation report that ties to the ledger.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics`, `managerial-and-cost-accounting` (cost
  concepts and standard costs), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: inventory costing is algorithmic; each rule is a runnable engine
  step with observable layers and totals.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Account for inventory and cost of
  goods sold so margins are correct."); `estimatedHours` from the drift test.

## Accuracy notes

- IAS 2 "Inventories" (revision December 2003): lower of cost and net realizable value, no LIFO:
  `https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/`, accessed 2026-10-09.
- ASC 330 under US GAAP permits LIFO; the authoring session found no 2025–2026 amendment
  (absence-of-evidence finding from Deloitte DART on 2026-10-09). The maker cites a primary FASB source
  before teaching the US GAAP measurement rule.
- Shipping-term examples use Incoterms 2020 names; the maker cites the ICC page with its access date.

## Concepts

- **co-01 · perpetual-vs-periodic** — continuous records versus a period-end count.
- **co-02 · cost-flow** — FIFO, weighted average, specific identification; LIFO only under US GAAP.
- **co-03 · cost-layers** — the receipts that make up an item's cost.
- **co-04 · inventory-cost** — purchase price plus landed costs; storage after receipt excluded.
- **co-05 · cogs-posting** — cost of goods sold posted on shipment.
- **co-06 · nrv-write-down** — writing down to net realizable value, and reversal under IFRS.
- **co-07 · counts-and-shrinkage** — cycle counts and adjustments.
- **co-08 · standard-cost-inventory** — standard costs with purchase price variance.
- **co-09 · ownership-transfer** — shipping terms, goods in transit, and consignment.
- **co-10 · returns** — customer returns and returns to suppliers.
- **co-11 · valuation-tie-out** — the valuation report equals the ledger balance.
- **co-12 · negative-stock** — why it happens and how to prevent or handle it.
- **co-13 · manufacturing-flow** — raw materials to work in process to finished goods.
- **co-14 · inventory-metrics** — turnover and days on hand.
- **co-15 · traceability** — lot and serial tracking for recalls and audits.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · stock-card** — keep a stock card per item — verify quantity on hand. (co-01)
- **ex-02 · periodic-cogs** — compute COGS from opening, purchases, and closing — verify. (co-01)
- **ex-03 · receipt-layer** — create a cost layer on receipt — verify. (co-03)
- **ex-04 · fifo-issue** — issue from the oldest layer — verify cost. (co-02, co-03)
- **ex-05 · fifo-across-layers** — issue across two layers — verify. (co-02)
- **ex-06 · moving-average** — update the moving average on each receipt — verify. (co-02)
- **ex-07 · periodic-average** — compute a periodic average — verify the difference from moving
  average. (co-02)
- **ex-08 · specific-identification** — cost serial-numbered items individually — verify. (co-02)
- **ex-09 · lifo-comparison** — compute LIFO for comparison only — verify why IFRS forbids it. (co-02)
- **ex-10 · receipt-posting** — post inventory and the receipt accrual — verify. (co-04)
- **ex-11 · shipment-posting** — post COGS and inventory relief — verify. (co-05)
- **ex-12 · gross-margin** — compute margin per sale — verify. (co-05)
- **ex-13 · method-comparison** — compare margins under three methods in rising prices — verify.
  (co-02)
- **ex-14 · landed-cost** — add freight and duty to cost — verify the unit cost. (co-04)
- **ex-15 · landed-cost-allocation** — allocate freight by weight or value — verify. (co-04)
- **ex-16 · storage-excluded** — expense storage after receipt — verify. (co-04)
- **ex-17 · customer-return** — return goods to stock at original cost — verify. (co-10)
- **ex-18 · supplier-return** — return goods to a supplier — verify the layer removed. (co-10)
- **ex-19 · valuation-report** — list layers and value per item — verify. (co-11)
- **ex-20 · tie-out** — tie valuation to the ledger — verify zero difference. (co-11)
- **ex-21 · flow-diagram** — draw the movement flow (Mermaid) — verify each movement's posting. (co-05)
- **ex-22 · units-of-measure** — convert boxes to units — verify cost per unit. (co-03)
- **ex-23 · item-master** — validate item records — verify. (co-03)
- **ex-24 · turnover** — compute turnover and days on hand — verify. (co-14)
- **ex-25 · beginner-engine** — run a month for three items — verify. (co-01–co-14)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · cycle-count** — record a count — verify the variance. (co-07)
- **ex-27 · shrinkage-entry** — post the shrinkage — verify. (co-07)
- **ex-28 · count-cut-off** — freeze movements during a count — verify. (co-07)
- **ex-29 · nrv-test** — compare cost with net realizable value — verify the write-down. (co-06)
- **ex-30 · nrv-entry** — post the write-down — verify. (co-06)
- **ex-31 · nrv-reversal** — reverse a write-down under IFRS when NRV recovers — verify the cap.
  (co-06)
- **ex-32 · obsolete-stock** — provide for slow-moving stock by age — verify. (co-06)
- **ex-33 · standard-cost-receipt** — receive at standard and post the purchase price variance —
  verify. (co-08)
- **ex-34 · standard-cost-update** — revalue stock on a standard change — verify. (co-08)
- **ex-35 · goods-in-transit** — record goods in transit by shipping term — verify ownership. (co-09)
- **ex-36 · consignment-out** — keep goods at a consignee on our books — verify. (co-09)
- **ex-37 · consignment-in** — keep a consignor's goods off our books — verify. (co-09)
- **ex-38 · negative-stock-block** — block issues beyond stock — verify. (co-12)
- **ex-39 · negative-stock-allowed** — allow negative stock and correct cost later — verify the
  revaluation. (co-12)
- **ex-40 · backdated-receipt** — insert a late receipt — verify the recalculated FIFO. (co-03)
- **ex-41 · raw-to-wip** — issue raw materials to production — verify. (co-13)
- **ex-42 · wip-to-finished** — complete production at cost — verify. (co-13)
- **ex-43 · scrap-in-production** — record normal and abnormal scrap — verify. (co-13)
- **ex-44 · transfer-between-warehouses** — move stock with cost — verify both locations. (co-03)
- **ex-45 · reservations** — reserve stock for orders — verify available quantity. (co-15)
- **ex-46 · lot-tracking** — track lots — verify a recall query. (co-15)
- **ex-47 · serial-tracking** — track serials — verify. (co-15)
- **ex-48 · inventory-close-tasks** — run period-end tasks — verify. (co-11)
- **ex-49 · cogs-by-segment** — report COGS by product line — verify. (co-05)
- **ex-50 · intermediate-engine** — run a quarter — verify the tie-out. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · layer-store-design** — store layers in `sqlite3` — verify a reload. (co-03)
- **ex-52 · costing-as-replay** — recompute cost by replaying movements — verify equals the stored
  cost. (co-03)
- **ex-53 · out-of-order-movements** — process movements by effective date — verify. (co-03)
- **ex-54 · cost-adjustment-after-invoice** — adjust cost when the invoice price differs — verify the
  split between stock and COGS. (co-04)
- **ex-55 · freight-after-sale** — landed cost that arrives after the goods were sold — verify COGS
  absorbs it. (co-04)
- **ex-56 · multi-currency-receipt** — cost a foreign purchase at the receipt rate — verify. (co-04)
- **ex-57 · rebates-from-suppliers** — reduce cost by a volume rebate — verify. (co-04)
- **ex-58 · kits-and-bundles** — cost a kit from components — verify. (co-13)
- **ex-59 · by-products** — allocate joint cost — verify. (co-13)
- **ex-60 · inventory-valuation-at-date** — value stock as of a past date — verify. (co-11)
- **ex-61 · fifo-performance** — compare naive and indexed layer lookups — verify identical results.
  (co-03)
- **ex-62 · concurrency-simulation** — simulate two issues against the last unit with a seeded
  scheduler — verify one is refused. (co-12)
- **ex-63 · sample-count-seeded** — choose items for a cycle count with a fixed seed — verify. (co-07)
- **ex-64 · abc-classification** — classify items by value — verify. (co-14)
- **ex-65 · dead-stock-report** — list items with no movement in 180 days — verify. (co-06)
- **ex-66 · zakat-trade-goods-preview** — value trade goods for a later zakah base — verify the
  valuation basis is a parameter. (co-11)
- **ex-67 · inventory-api-validation** — validate movement payloads — verify. (co-03)
- **ex-68 · movement-events** — post from inventory events through posting rules — verify. (co-05)
- **ex-69 · audit-trail** — trace a COGS amount to its layers and receipts — verify. (co-11)
- **ex-70 · costing-method-change** — show why a method change is a policy change — verify the
  restated figures. (co-02)
- **ex-71 · property-check** — over fixed seeds, quantity and value never go negative when blocking is
  on — verify. (co-12)
- **ex-72 · property-tie-out** — over fixed seeds, valuation always equals the ledger — verify. (co-11)
- **ex-73 · reconciliation-report** — explain differences between subledger and ledger — verify.
  (co-11)
- **ex-74 · review-checklist** — review an inventory design — verify. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-fifo-wrong-layer`, `kata-02-average-not-updated`,
  `kata-03-landed-cost-expensed`, `kata-04-nrv-reversal-uncapped`, `kata-05-negative-stock-silent`,
  `kata-06-transfer-loses-cost`, `kata-07-count-during-movements`, `kata-08-valuation-not-tied`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**An inventory valuation engine.** Items, warehouses, receipts with landed costs, FIFO and moving
average per item, shipments posting COGS, returns, counts, NRV write-downs, standard costs with PPV,
and a valuation report that ties to the ledger. The `run.yaml` runs a scripted quarter and compares
the valuation and tie-out reports.

## Code and harness

- Python standard library and `sqlite3`; concurrency by seeded deterministic scheduler only.

## Lineage

- Replaces the 237-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 3 (Assets, costs, and inventory), position 10.
- `skills/sharia-accounting` — Phase 3 (Assets, costs, and inventory), position 10 · trade goods
  reappear in the zakah base.
