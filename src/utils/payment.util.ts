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
    // If USD is not supported by the merchant Paystack integration, 
    // we process the transaction in NGN at the converted rate.
    // Standard exchange rate of 1 USD = 1,500 NGN.
    const exchangeRate = 1500;
    const usdAmount = 30; // $30 USD
    const ngnAmount = usdAmount * exchangeRate; // 45,000 NGN

    return {
      currency: "NGN", // Charged in NGN to avoid Paystack integration issues
      amount: ngnAmount * 100, // 45,000 Naira in Kobo
      displayPrice: `$30 (₦${ngnAmount.toLocaleString()})`, // Display the conversion to the user
    };
  }
};
