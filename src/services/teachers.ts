import { supabase } from "../lib/supabase";

export async function getTeachers() {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("last_name");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}