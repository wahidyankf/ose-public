// Role ladder + role × country salary matrix.
//
// Values live in `libs/ayokoding-data/data/cost-of-living.json` (the `roleMatrix`
// section); provenance in `libs/ayokoding-data/provenance.md`. This module keeps
// the original path and named exports; the JSON is the only declaration.
import livingJson from "../../../../../../../libs/ayokoding-data/data/cost-of-living.json";

type Confidence = "high" | "moderate" | "proxy";
type Track = "ic" | "mgmt";
export type EngRole =
  | "swe_1"
  | "swe_2"
  | "senior_swe"
  | "eng_manager"
  | "staff_swe"
  | "senior_eng_manager"
  | "senior_staff_swe"
  | "director"
  | "principal_swe"
  | "senior_director"
  | "distinguished_swe"
  | "vp_eng"
  | "fellow"
  | "svp_eng"
  | "cto";

type SalaryPoint = {
  monthlyGrossLocal: number;
  confidence: Confidence;
  note?: string;
};

type RoleSalaryDistribution = {
  p25: SalaryPoint;
  median: SalaryPoint;
  p75: SalaryPoint;
  nonSalaryComp: { annualLocal: number; confidence: Confidence; note?: string };
};

export type RoleMeta = {
  role: EngRole;
  rank: number;
  track: Track;
  label: { en: string; id: string };
};

export type RoleMatrix = {
  snapshotDate: string;
  ladder: RoleMeta[];
  salaries: Record<string, Record<EngRole, RoleSalaryDistribution>>;
};

// ─── Ladder + Country salary tables (from shared JSON) ───────────────────────

export const ladder: RoleMeta[] = (livingJson.roleMatrix as { ladder: RoleMeta[] }).ladder as RoleMeta[];

export const roleMatrix: RoleMatrix = {
  snapshotDate: (livingJson.roleMatrix as { snapshotDate: string }).snapshotDate,
  ladder,
  salaries: (livingJson.roleMatrix as { salaries: RoleMatrix["salaries"] }).salaries as RoleMatrix["salaries"],
};
