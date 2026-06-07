import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthMethods {
  email: boolean;
  google: boolean;
  apple: boolean;
  whatsapp: boolean;
}

export const DEFAULT_AUTH_METHODS: AuthMethods = {
  email: true,
  google: true,
  apple: true,
  whatsapp: true,
};

export const AUTH_METHODS_KEY = "authMethods";

function normalize(value: unknown): AuthMethods {
  const v = (value ?? {}) as Partial<AuthMethods>;
  return {
    email: v.email ?? DEFAULT_AUTH_METHODS.email,
    google: v.google ?? DEFAULT_AUTH_METHODS.google,
    apple: v.apple ?? DEFAULT_AUTH_METHODS.apple,
    whatsapp: v.whatsapp ?? DEFAULT_AUTH_METHODS.whatsapp,
  };
}

/** Reads which sign-in / sign-up methods are enabled by the admin. */
export function useAuthMethods() {
  const query = useQuery({
    queryKey: ["auth-methods"],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<AuthMethods> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", AUTH_METHODS_KEY)
        .maybeSingle();
      return normalize(data?.value);
    },
  });

  return {
    methods: query.data ?? DEFAULT_AUTH_METHODS,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
