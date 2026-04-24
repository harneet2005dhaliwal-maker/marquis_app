import { supabase } from "../lib/supabase";

export async function getStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("last_name");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}