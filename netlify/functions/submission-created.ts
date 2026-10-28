import { connectLambda } from "@netlify/blobs";
import { saveSubmission } from "../lib/store";

/**
 * Netlify runs this after every verified form submission (the file name is
 * what makes that happen). It keeps a copy of the survey's tick-box answers
 * for the live results page. Comments, IP addresses and emails are not kept.
 */
type Event = Parameters<typeof connectLambda>[0] & { body?: string | null };

export const handler = async (event: Event) => {
  try {
    const payload = JSON.parse(event.body ?? "{}")?.payload;
    if (
      payload?.form_name !== "survey" ||
      typeof payload.created_at !== "string"
    )
      return { statusCode: 200 };
    connectLambda(event);
    await saveSubmission({
      created_at: payload.created_at,
      data: payload.data ?? {},
    });
  } catch (error) {
    // Never block the submission itself.
    console.error(error);
  }
  return { statusCode: 200 };
};
