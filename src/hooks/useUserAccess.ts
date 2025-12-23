import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useHasActiveSubscription } from "./useSubscription";

export type UserAccessLevel = "guest" | "registered" | "subscribed";

interface UserAccess {
  level: UserAccessLevel;
  isGuest: boolean;
  isRegistered: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  canAccessFullContent: boolean;
  canAccessPreview: boolean;
  requiresAuth: boolean;
  // Subscription details
  isPastDue: boolean;
  isExpired: boolean;
  autoRenew: boolean;
}

/**
 * Hook to determine user's access level based on authentication and subscription status
 * 
 * Access levels:
 * - guest: Not logged in
 * - registered: Logged in but no active subscription
 * - subscribed: Logged in with active subscription (status = 'activa' OR 'cancelada' with end_date >= today)
 * 
 * Rules:
 * - User is 'subscribed' only if status = 'activa' AND end_date >= today
 * - Cancelled users keep access until end_date (hasAccess = true, but level = 'subscribed')
 * - Past due users (failed payment) have NO access
 * - Expired users have NO access
 */
export const useUserAccess = (): UserAccess => {
  const { user, loading: authLoading } = useAuth();
  const { 
    hasAccess, 
    isLoading: subscriptionLoading,
    isPastDue,
    isExpired,
    autoRenew,
  } = useHasActiveSubscription();

  const isLoading = authLoading || (user ? subscriptionLoading : false);

  const level = useMemo((): UserAccessLevel => {
    if (!user) return "guest";
    if (hasAccess) return "subscribed";
    return "registered";
  }, [user, hasAccess]);

  return {
    level,
    isGuest: level === "guest",
    isRegistered: level === "registered",
    isSubscribed: level === "subscribed",
    isLoading,
    canAccessFullContent: level === "subscribed",
    canAccessPreview: level === "registered" || level === "subscribed",
    requiresAuth: level === "guest",
    // Subscription details
    isPastDue: !!isPastDue,
    isExpired: !!isExpired,
    autoRenew: !!autoRenew,
  };
};
