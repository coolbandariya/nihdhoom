/**
 * Turns raw Supabase / network errors into a plain explanation plus the next
 * step. The raw message is always kept, so nothing is hidden from operators.
 */
export type LiveProblemKind =
  | 'not-signed-in'
  | 'not-migrated'
  | 'bad-key'
  | 'unreachable'
  | 'permission'
  | 'unknown';

export interface LiveProblem {
  kind: LiveProblemKind;
  /** One short sentence a farmer or judge can read. */
  summary: string;
  /** What to do next. */
  hint: string;
}

export function describeLiveError(message: string | null | undefined): LiveProblem {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  if (/invalid api key|invalid jwt|apikey|no api key/.test(lower)) {
    return {
      kind: 'bad-key',
      summary: 'The database key on this deployment is not accepted.',
      hint: 'Check VITE_SUPABASE_PUBLISHABLE_KEY in Vercel (use the anon / publishable key, not the service key), then redeploy.',
    };
  }
  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed|enotfound|econnrefused/.test(lower)) {
    return {
      kind: 'unreachable',
      summary: 'The database could not be reached.',
      hint: 'Check VITE_SUPABASE_URL in Vercel and that the Supabase project is not paused, then redeploy.',
    };
  }
  if (/could not find the table|does not exist|schema cache|relation .* does not exist|pgrst20[0-9]|42p01|42703/.test(lower)) {
    return {
      kind: 'not-migrated',
      summary: 'The database has no NIRDHOOM tables yet, or is missing some of them.',
      hint: 'Apply the SQL migrations in order (see docs/GO-LIVE.md), then reload.',
    };
  }
  if (/permission denied|row-level security|42501|not authorized|jwt expired/.test(lower)) {
    return {
      kind: 'permission',
      summary: 'This account is not allowed to read these records.',
      hint: 'Sign in with your mobile number. If you are already signed in, the profile role may be missing.',
    };
  }
  return {
    kind: 'unknown',
    summary: 'Live records could not be loaded.',
    hint: 'Reload the page. If it keeps happening, run `npm run doctor` and check the browser console.',
  };
}

/** Auth errors from signInWithOtp / verifyOtp, in words a farmer can act on. */
export function describeAuthError(message: string | null | undefined, fallback: string): string {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();
  if (!text) return fallback;
  if (/unsupported phone provider|sms provider|phone provider|twilio|messagebird|vonage|textlocal/.test(lower)) {
    return 'SMS sign-in is not switched on for this site yet. The site owner needs to enable Phone sign-in and an SMS provider in Supabase.';
  }
  if (/signups? (are|is) disabled|phone logins? (are|is) disabled|phone.*disabled/.test(lower)) {
    return 'Phone sign-in is turned off in Supabase. The site owner needs to enable the Phone provider.';
  }
  if (/rate limit|too many|security purposes|only request this after/.test(lower)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (/token has expired|invalid.*(otp|token|code)|otp.*(expired|invalid)/.test(lower)) {
    return 'That code is wrong or has expired. Check the SMS or ask for a new code.';
  }
  if (/invalid.*phone|phone.*invalid|unable to validate phone/.test(lower)) {
    return 'That mobile number does not look right. Enter the 10 digits without +91.';
  }
  return text;
}
