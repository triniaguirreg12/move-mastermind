import { useMemo } from "react";
import { useUserProfile } from "./useUserProfile";

export type PaymentGateway = "mercado_pago" | "paypal";
export type Currency = "CLP" | "USD";

interface PaymentGatewayInfo {
  gateway: PaymentGateway;
  currency: Currency;
  isChile: boolean;
  isLoading: boolean;
}

/**
 * Determines the payment gateway based on user's country
 * - Chile → Mercado Pago (CLP)
 * - Other countries → PayPal (USD)
 */
export function usePaymentGateway(): PaymentGatewayInfo {
  const { data: profile, isLoading } = useUserProfile();

  return useMemo(() => {
    const country = profile?.country?.toLowerCase().trim() ?? "";
    const isChile = country === "chile" || country === "cl";

    return {
      gateway: isChile ? "mercado_pago" : "paypal",
      currency: isChile ? "CLP" : "USD",
      isChile,
      isLoading,
    };
  }, [profile?.country, isLoading]);
}

/**
 * Format price based on currency
 */
export function formatPrice(price: number, currency: Currency): string {
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}
