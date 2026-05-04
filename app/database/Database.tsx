import { supabase } from "./SupabaseClient";

/** Fetch all messages from the DB */
export async function fetchMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}


/** Insert a message to the DB */
export async function insertMessage(message: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ content: message })
    .select("*")
    .single();

    if (error) throw error;
    return data;
}