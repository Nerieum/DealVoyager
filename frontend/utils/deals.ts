import type { MobilePlan, OperatorSettings } from "../types/deals";

export type FeeField = "simPrice" | "activationPrice" | "cancellationPrice";
export const feeFields: FeeField[] = [
  "simPrice",
  "activationPrice",
  "cancellationPrice",
];

export function getEffectiveFee(
  deal: MobilePlan,
  operators: OperatorSettings[],
  field: FeeField,
): number | null {
  return (
    operators.find((operator) => operator.operatorName === deal.operator)?.[
      field
    ] ??
    deal[field] ??
    null
  );
}

export function filterAndSortDeals(
  deals: MobilePlan[],
  operators: OperatorSettings[],
  minimumData: number,
  networks: string[],
): MobilePlan[] {
  const matchingDeals = deals.filter(
    (deal) =>
      deal.dataGb >= minimumData &&
      networks.some((network) =>
        deal.network?.toLowerCase().includes(network.toLowerCase()),
      ),
  );

  // Keep the existing monthly-price sort for "all volumes", after applying networks.
  if (minimumData === 0) return matchingDeals.sort((a, b) => a.price - b.price);

  const missingFees = (deal: MobilePlan) =>
    feeFields.filter((field) => getEffectiveFee(deal, operators, field) == null)
      .length;
  const annualCost = (deal: MobilePlan) =>
    deal.price * 12 +
    feeFields.reduce(
      (total, field) => total + (getEffectiveFee(deal, operators, field) ?? 0),
      0,
    );

  return matchingDeals.sort(
    (a, b) =>
      missingFees(a) - missingFees(b) ||
      annualCost(a) - annualCost(b) ||
      b.dataGb - a.dataGb,
  );
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);

export const formatData = (value: number) =>
  value >= 9999
    ? "Illimité"
    : value < 1
      ? `${Math.round(value * 1000)} Mo`
      : `${value} Go`;
