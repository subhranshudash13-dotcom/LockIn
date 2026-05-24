/**
 * 🏷️ APP IDENTITY — Change these values to rebrand the app.
 *
 * These are referenced across landing, auth, onboarding, and profile screens.
 * Update them once here and they propagate everywhere.
 *
 * Steps to rebrand:
 *   1. Change APP_NAME, APP_TAGLINE, and APP_DESCRIPTION below
 *   2. Update app.json → expo.name and expo.slug
 *   3. Change ACCENT in lib/theme.ts for color rebrand
 */

/** Display name shown in headers, onboarding, and the landing page. */
export const APP_NAME = 'LockIn'

/** URL scheme matching expo.scheme in app.json — used for OAuth deep link callbacks. */
export const APP_SCHEME = 'lockin'

/** Support email shown on the Support screen. */
export const APP_SUPPORT_EMAIL = 'support@lockin.app'

/** Documentation URL shown on the Support screen. */
export const APP_DOCS_URL = 'https://lockin.app/docs'

/** One-liner shown on the landing page below the app name. */
export const APP_TAGLINE = 'Enter The Flow. Reclaim Your Reality.'

/** Short description used in marketing / onboarding contexts. */
export const APP_DESCRIPTION =
  'A high-fidelity focus operating system designed to shatter dopamine addiction and unlock your peak potential through behavioral engineering.'
