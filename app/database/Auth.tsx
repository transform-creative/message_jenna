import { supabase } from "./SupabaseClient";

/*************************
 * Sign user in with otp
 * @param email Email address to try sign in
 */
export async function supabaseSignIn(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) throw error;

  return data;
}

/*************************
 * Sign user in with otp code
 * @param email Email address to try sign in
 */
export async function SignInWithOtp(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: otp,
    type: "email",
  });

  if (error) throw error;

  return data;
}

/***************************
 * Sign out the session
 */
export async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) return error;

  return true;
}

/***********************
 * Handle error logging
 * @param error The error object
 * @param fn The function name
 */
export async function logError(err: any, stack?: string[]) {
  insertLog(err?.message || "", "error", {
    stack: stack?.toString(),
  });
  return true;
}

/****************************
 * Insert logs into the database
 * @param event_type An event message or brief description
 * @param severity 
 * @param metadata Any object
 */
export async function insertLog(
  event_type: string,
  severity: "info" | "warning" | "error" | "critical",
  metadata: Object,
) {
  //Log locally in dev
  if (process.env.NODE_ENV === "development") {
    console.info(severity, event_type, metadata);
    return;
  }

  const { data, error } = await supabase.functions.invoke(
    "insert-logs",
    {
      body: {
        event_type,
        severity,
        metadata,
      },
    },
  );
}
