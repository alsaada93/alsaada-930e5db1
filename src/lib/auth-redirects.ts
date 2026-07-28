export const NATIVE_OAUTH_CALLBACK = "harajalsaada://login-callback";
export const AUTH_CALLBACK_PATH = "/auth/callback";

/**
 * Keep Google OAuth on the same browser-safe client flow for both the website
 * and the Capacitor Android shell. The Lovable OAuth broker turns these into a
 * Google authorization request with response_type=code and PKCE S256, using the
 * configured Web OAuth client and the exact /~oauth/callback redirect URI.
 */
export const GOOGLE_OAUTH_OPTIONS = {
  client_type: "web",
  flow_type: "pkce",
  code_challenge_method: "S256",
  prompt: "select_account",
} as const;

export function getWebOAuthCallbackUrl() {
  return new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
}

export function getNativeOAuthBridgeUrl() {
  const url = new URL(AUTH_CALLBACK_PATH, window.location.origin);
  url.searchParams.set("native", "1");
  return url.toString();
}

export function isNativeCallbackUrl(url: string) {
  return url.startsWith(NATIVE_OAUTH_CALLBACK);
}

export function buildNativeCallbackUrl(sourceUrl: string) {
  const source = new URL(sourceUrl);
  const target = new URL(NATIVE_OAUTH_CALLBACK);
  const copyParam = (name: string) => {
    const value = source.searchParams.get(name) ?? new URLSearchParams(source.hash.replace(/^#/, "")).get(name);
    if (value) target.searchParams.set(name, value);
  };

  // The Lovable broker may return either an authorization code (PKCE) or the
  // session tokens directly in the hash. Forward whichever is present.
  copyParam("code");
  copyParam("access_token");
  copyParam("refresh_token");
  copyParam("expires_in");
  copyParam("token_type");
  copyParam("error");
  copyParam("error_code");
  copyParam("error_description");

  return target.toString();
}