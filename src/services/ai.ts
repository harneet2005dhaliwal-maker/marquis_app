import { supabase } from "../lib/supabase";

export async function askMarquisAI(body: any) {
  const { data, error } = await supabase.functions.invoke("marquis-ai", {
    body,
  });

  if (error) throw error;

  return data;
}