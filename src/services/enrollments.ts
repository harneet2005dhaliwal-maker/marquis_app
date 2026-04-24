import { supabase } from "../lib/supabase";

export async function getEnrollments() {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      *,
      students (
        first_name,
        last_name,
        year_level
      ),
      classes (
        subject,
        year_level,
        day_of_week,
        start_time,
        end_time
      )
    `);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}