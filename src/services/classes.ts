import { supabase } from "../lib/supabase";

export async function getClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      teachers (
        first_name,
        last_name
      )
    `);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}