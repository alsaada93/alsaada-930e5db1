# Google Sign-In configuration and test checklist

Use this checklist whenever Google sign-in is changed, the Android app is rebuilt, or the app is reinstalled on a device.

## 1) Exact OAuth URLs to register

Current app flow:

- Client type used by both website and Android shell: **Web OAuth client**
- OAuth flow: **Authorization Code + PKCE (S256)**
- Google redirect URI: the broker callback `/~oauth/callback`
- App return page after the broker finishes: `/auth/callback`
- Native app return after the HTTPS bridge: `harajalsaada://login-callback`

Do not create a separate Android redirect URI for the browser sign-in flow. The Android OAuth client is only for package/SHA registration; the actual sign-in request must still use the Web OAuth client and PKCE so Google receives the exact same redirect URI on web and Android.

### Google Cloud Console — Web OAuth client

Add these **Authorized JavaScript origins**:

- `https://www.alsaada.sale`
- `https://alsaada.sale`

Add these **Authorized redirect URIs** exactly as written:

- `https://www.alsaada.sale/~oauth/callback`
- `https://alsaada.sale/~oauth/callback`

Optional, only if testing Google sign-in on the Lovable published domain:

- Origin: `https://alsaada.lovable.app`
- Redirect URI: `https://alsaada.lovable.app/~oauth/callback`

Important: Google reports the real OAuth redirect as `/~oauth/callback`. Do **not** use `/auth/callback` as the Google redirect URI. `/auth/callback` is only the app return page after the OAuth broker has finished.

The request shown by Google should contain:

- `redirect_uri=https://www.alsaada.sale/~oauth/callback` or `https://alsaada.sale/~oauth/callback`
- `response_type=code`
- `code_challenge_method=S256`
- the Web OAuth Client ID

### Google Cloud Console — Android OAuth client

- Package name: `sale.alsaada.app`
- SHA-1: `33:A6:D3:69:20:B0:8E:49:7E:F9:5D:D0:21:C1:ED:46:9E:E4:0D:95`
- SHA-256: `5D:C8:86:1D:7B:A4:5D:23:F7:BB:C3:8E:4E:C3:99:4B:C8:E8:8D:45:28:C0:79:E0:AA:D1:A8:C6:EB:FB:61:1C`

Keep this Android client in the same Google Cloud project as the Web OAuth client. Do not use the Android client ID as the browser OAuth `client_id`; Google browser redirects must use the Web OAuth client.

### Backend auth redirect allow-list

Keep these return URLs allowed in the backend auth settings:

- `https://www.alsaada.sale`
- `https://alsaada.sale`
- `https://www.alsaada.sale/auth/callback`
- `https://alsaada.sale/auth/callback`
- `https://www.alsaada.sale/auth/callback?native=1`
- `https://alsaada.sale/auth/callback?native=1`
- `harajalsaada://login-callback`

## 2) Web test — `www` domain

1. Open `https://www.alsaada.sale/login` in an incognito/private window.
2. Click **المتابعة عبر جوجل**.
3. Confirm the Google consent screen opens without `redirect_uri_mismatch`.
4. Complete sign-in.
5. Confirm the user lands in the account area and remains signed in after refresh.
6. Sign out, then sign in again with the same Google account.

Pass condition: no Google error page appears, and the account session is created.

## 3) Web test — apex domain

1. Open `https://alsaada.sale/login` in an incognito/private window.
2. Repeat the full Google sign-in flow.
3. Confirm it does not redirect to a mismatched domain or show a Google OAuth policy error.

Pass condition: the same Google account signs in correctly from the apex domain.

## 4) Android installed-app test

1. Build and install the Android app signed with the same keystore that produced the SHA fingerprints above.
2. Open the app and go to login.
3. Tap **المتابعة عبر جوجل**.
4. Choose a Google account and approve.
5. Confirm the flow returns to the app through `harajalsaada://login-callback`.
6. Confirm the account page opens and the session remains after closing and reopening the app.

Pass condition: Google returns to the app, not only to the website, and the user session exists.

## 5) Android reinstall test

1. Uninstall the Android app completely.
2. Reinstall the latest signed build.
3. Open the app and repeat Google sign-in.
4. Confirm there is no stale-session error, no blank callback screen, and no redirect to the website home page.
5. Close the app, reopen it, and confirm the session is still active.

Pass condition: a fresh install signs in normally and keeps the session.

## 6) Failure checks

If Google shows `redirect_uri=https://www.alsaada.sale/~oauth/callback`, then the missing Google Console entry is exactly:

```text
https://www.alsaada.sale/~oauth/callback
```

If Google shows `redirect_uri=https://alsaada.sale/~oauth/callback`, then the missing Google Console entry is exactly:

```text
https://alsaada.sale/~oauth/callback
```

Copy the URI exactly: same `https`, same host, same path, no trailing slash, and no extra query string.