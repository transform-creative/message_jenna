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
export async function insertMessage(message: string, from_name: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ message, from_name })
    .select("*")
    .single();

    if (error) throw error;
    return data;
}

/** Fetch public URLs for all images in the 'jenna' storage bucket */
export async function fetchJennaImages(): Promise<string[]> {
  const { data, error } = await supabase.storage.from("jenna").list();
  console.log('jenna', data)
  if (error) throw error;
  return data.map((file) => {
    const { data: urlData } = supabase.storage
      .from("jenna")
      .getPublicUrl(file.name);
    return urlData.publicUrl;
  });
}