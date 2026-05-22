export type BonusDistributionTier = {
  name: string;
  fromPercent: number;
  toPercent: number;
  weight: number;
};

export type BonusRuleConfig = {
  minTripCount: number;
  singleLeaderCap: number;
  redistributeRemainder: boolean;
  includeInternLeaders: boolean;
  includeFullTimeAndPartTimeTogether: boolean;
  holidayPointsBindingMode: "POINTS_ONLY" | "REQUIRED";
  disqualifySeriousComplaint: boolean;
  redlineClearsPoints: boolean;
  disqualifyRedline: boolean;
  distributionMode: "TIER_WEIGHT";
  tiers: BonusDistributionTier[];
};

export const DEFAULT_BONUS_RULE_CONFIG: BonusRuleConfig = {
  minTripCount: 8,
  singleLeaderCap: 2000,
  redistributeRemainder: false,
  includeInternLeaders: true,
  includeFullTimeAndPartTimeTogether: true,
  holidayPointsBindingMode: "POINTS_ONLY",
  disqualifySeriousComplaint: true,
  redlineClearsPoints: true,
  disqualifyRedline: true,
  distributionMode: "TIER_WEIGHT",
  tiers: [
    { name: "A档", fromPercent: 0, toPercent: 20, weight: 1.8 },
    { name: "B档", fromPercent: 20, toPercent: 50, weight: 1.3 },
    { name: "C档", fromPercent: 50, toPercent: 100, weight: 1.0 },
  ],
};

export function getBonusRuleSnapshot() {
  return DEFAULT_BONUS_RULE_CONFIG;
}
