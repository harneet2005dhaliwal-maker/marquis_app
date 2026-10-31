const CLASSROOM_API_BASE =
  "https://classroom.googleapis.com/v1";

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
  courseState?: string;
}

export interface GoogleClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;

  dueDate?: {
    year: number;
    month: number;
    day: number;
  };

  dueTime?: {
    hours?: number;
    minutes?: number;
  };

  maxPoints?: number;
}

export interface GoogleClassroomSubmission {
  id: string;
  courseId: string;
  courseWorkId: string;
  userId?: string;
  state?: string;
  late?: boolean;
  assignedGrade?: number;
  draftGrade?: number;
  alternateLink?: string;
}

interface GoogleClassroomApiError extends Error {
  status?: number;
}

async function classroomFetch<T>(
  url: string,
  providerToken: string
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${providerToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage =
      `Google Classroom request failed (${response.status})`;

    try {
      const body = await response.json();

      errorMessage =
        body?.error?.message ??
        errorMessage;
    } catch {
      // Keep fallback message.
    }

    const error =
      new Error(
        errorMessage
      ) as GoogleClassroomApiError;

    error.status = response.status;

    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Get active Google Classroom courses visible to
 * the currently signed-in Google account.
 *
 * We intentionally do not filter by studentId=me
 * because the connected Google account may also be
 * a teacher/admin in some classes.
 */
export async function getGoogleClassroomCourses(
  providerToken: string
): Promise<GoogleClassroomCourse[]> {
  const courses: GoogleClassroomCourse[] = [];

  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      courseStates: "ACTIVE",
      pageSize: "100",
    });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    const data =
      await classroomFetch<{
        courses?: GoogleClassroomCourse[];
        nextPageToken?: string;
      }>(
        `${CLASSROOM_API_BASE}/courses?${params.toString()}`,
        providerToken
      );

    courses.push(
      ...(data.courses ?? [])
    );

    pageToken =
      data.nextPageToken;
  } while (pageToken);

  console.log(
    "Google Classroom courses returned:",
    courses
  );

  return courses;
}

/**
 * Get all published coursework for one Google course.
 *
 * Some visible courses may not allow this account
 * to read coursework. In that case we skip the course
 * rather than breaking the whole dashboard.
 */
export async function getGoogleClassroomCoursework(
  courseId: string,
  providerToken: string
): Promise<GoogleClassroomCourseWork[]> {
  const courseWork:
    GoogleClassroomCourseWork[] = [];

  let pageToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        courseWorkStates: "PUBLISHED",
        pageSize: "100",
      });

      if (pageToken) {
        params.set(
          "pageToken",
          pageToken
        );
      }

      const data =
        await classroomFetch<{
          courseWork?: GoogleClassroomCourseWork[];
          nextPageToken?: string;
        }>(
          `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(
            courseId
          )}/courseWork?${params.toString()}`,
          providerToken
        );

      courseWork.push(
        ...(data.courseWork ?? [])
      );

      pageToken =
        data.nextPageToken;
    } while (pageToken);

    return courseWork;
  } catch (error) {
    const apiError =
      error as GoogleClassroomApiError;

    if (
      apiError.status === 403 ||
      apiError.message
        .toLowerCase()
        .includes("permission")
    ) {
      console.warn(
        `Skipping coursework for course ${courseId}: no permission`
      );

      return [];
    }

    throw error;
  }
}

/**
 * Get the current user's own submissions for
 * all coursework in a course.
 *
 * For actual student accounts, userId="me" is correct.
 *
 * If the connected Google account is a teacher/admin
 * in a particular class, Google may return 403 for this
 * student-specific endpoint. In that case we return []
 * rather than failing the entire app.
 */
export async function getMyGoogleClassroomSubmissions(
  courseId: string,
  providerToken: string
): Promise<GoogleClassroomSubmission[]> {
  const submissions:
    GoogleClassroomSubmission[] = [];

  let pageToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        userId: "me",
        pageSize: "100",
      });

      if (pageToken) {
        params.set(
          "pageToken",
          pageToken
        );
      }

      const data =
        await classroomFetch<{
          studentSubmissions?: GoogleClassroomSubmission[];
          nextPageToken?: string;
        }>(
          `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(
            courseId
          )}/courseWork/-/studentSubmissions?${params.toString()}`,
          providerToken
        );

      submissions.push(
        ...(data.studentSubmissions ?? [])
      );

      pageToken =
        data.nextPageToken;
    } while (pageToken);

    return submissions;
  } catch (error) {
    const apiError =
      error as GoogleClassroomApiError;

    if (
      apiError.status === 403 ||
      apiError.message
        .toLowerCase()
        .includes("permission")
    ) {
      console.warn(
        `Skipping submissions for course ${courseId}: no permission`
      );

      return [];
    }

    throw error;
  }
}