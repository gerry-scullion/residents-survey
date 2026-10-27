import { createFileRoute } from "@tanstack/react-router";
import { BackToSurvey } from "@/components/page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "What happens to your answers" },
      {
        name: "description",
        content:
          "What happens to the answers you give about living on Kincora Avenue, Kincora Grove and Kincora Drive.",
      },
      { property: "og:title", content: "What happens to your answers" },
      {
        property: "og:description",
        content:
          "What happens to the answers you give about living on Kincora Avenue, Kincora Grove and Kincora Drive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const body = "text-[1.1875rem] leading-[1.5] max-w-[36rem]";

function Privacy() {
  return (
    <main className="min-h-screen bg-govuk-white px-4 pb-16 pt-6 font-govuk text-govuk-black md:px-8 md:pb-24 md:pt-12">
      <div className="mx-auto w-full max-w-[40rem]">
        <h1 className="text-[2rem] md:text-[2.5rem] font-bold leading-[1.1] tracking-[-0.01em] text-balance max-w-[30rem]">
          What happens to your answers
        </h1>

        <p className={`mt-5 ${body}`}>
          We do not ask for your name or your house number. Please do not
          include them in the written answers.
        </p>

        <p className={`mt-5 ${body}`}>
          Only the two of us can see the responses. We will write a summary and
          share it with the residents&rsquo; committee and with the three roads.
          The summary will not identify anyone. Because these are small roads,
          we will leave out any detail that could point to one household.
        </p>

        <p className={`mt-5 ${body}`}>
          If you give us your email address, it is stored separately from your
          answers and cannot be matched back to them. We will only use it to
          send you the summary. You can ask us to delete it at any time.
        </p>

        <p className={`mt-5 ${body}`}>
          We will delete everything once the summary has been shared and the
          committee has made its decision.
        </p>

        <p className={`mt-10 ${body}`}>
          <BackToSurvey>Back to the survey</BackToSurvey>
        </p>
      </div>
    </main>
  );
}
