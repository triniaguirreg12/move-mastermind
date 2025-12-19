import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

// Fetch all profiles for admin purposes
export function useAllProfiles() {
  return useQuery({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, email")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as Profile[];
    },
  });
}
