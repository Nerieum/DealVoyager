export interface MobilePlan {
  id: number;
  operator: string;
  planName: string;
  price: number;
  simPrice: number | null;
  activationPrice: number | null;
  cancellationPrice: number | null;
  dataGb: number;
  calls: string | null;
  sms: string | null;
  network: string | null;
  networkGeneration: string | null;
  dataEuGb: number | null;
  score: number | null;
  url: string | null;
}

export interface OperatorSettings {
  operatorName: string;
  isFairplay: boolean;
  simPrice: number | null;
  activationPrice: number | null;
  cancellationPrice: number | null;
}

export interface DealStats {
  totalOffers: number;
  lastUpdate: string | null;
  lastScrape?: { outcomes: { operator: string }[] } | null;
}
