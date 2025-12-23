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
}

export const useUserAccess = (): UserAccess => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: subscriptionLoading } = useHasActiveSubscription();

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
  };
};
