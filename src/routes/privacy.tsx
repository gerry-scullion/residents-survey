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

        <p className={`mt-6 ${body}`}>
          We&rsquo;ll read every answer by the end of November.
        </p>

        <p className={`mt-5 ${body}`}>
          We&rsquo;ll then write a report for the Kincora Residents Committee
          and work with them to plan for 2027.
        </p>

        <p className={`mt-5 ${body}`}>
          We don&rsquo;t ask for your name or house number. Please leave them
          out of anything you write, too.
        </p>

        <p className={`mt-5 ${body}`}>
          The report won&rsquo;t name anyone. These are small roads, so
          we&rsquo;ll leave out anything that could point to one house.
        </p>

        <h2 className="mt-10 text-[1.5rem] font-bold leading-[1.2] md:text-[1.875rem]">
          Getting a copy of the report
        </h2>

        <p className={`mt-4 ${body}`}>
          At the end of the survey you can leave your email address and
          we&rsquo;ll send you the report. It&rsquo;s kept apart from your
          answers and can&rsquo;t be matched to them.
        </p>

        <p className={`mt-10 ${body}`}>
          <BackToSurvey>Back to the survey</BackToSurvey>
        </p>
      </div>
    </main>
  );
}
