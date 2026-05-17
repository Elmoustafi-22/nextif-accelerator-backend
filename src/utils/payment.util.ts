import geoip from "geoip-lite";

export interface PriceConfig {
  currency: "NGN" | "USD";
  amount: number; // in kobo or cents
  displayPrice: string;
}

export const getPriceByIP = (ip: string): PriceConfig => {
  // geoip-lite doesn't work well with localhost/private IPs, 
  // so we default to Nigeria for local development or if lookup fails.
  const geo = geoip.lookup(ip);
  const isNigerian = !geo || geo.country === "NG";

  if (isNigerian) {
    return {
      currency: "NGN",
      amount: 20000 * 100, // 20,000 Naira in Kobo
      displayPrice: "₦20,000",
    };
  } else {
    return {
      currency: "USD",
      amount: 30 * 100, // 30 Dollars in Cents
      displayPrice: "$30",
    };
  }
};
