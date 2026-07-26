export const NATIVE_OAUTH_CALLBACK = "harajalsaada://login-callback";
export const AUTH_CALLBACK_PATH = "/auth/callback";

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

  copyParam("code");
  copyParam("error");
  copyParam("error_code");
  copyParam("error_description");

  return target.toString();
}