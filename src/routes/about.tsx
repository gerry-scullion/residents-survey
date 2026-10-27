import { createFileRoute } from "@tanstack/react-router";
import { BackToSurvey } from "@/components/page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Who's behind this" },
      { name: "description", content: "Two people running the Kincora questions voluntarily with the Kincora Residents Committee." },
      { property: "og:title", content: "Who's behind this" },
      { property: "og:description", content: "Two people running the Kincora questions voluntarily with the Kincora Residents Committee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const body = "text-[1.1875rem] leading-[1.5] max-w-[36rem]";

function About() {
  return (
    <main className="min-h-screen bg-govuk-white px-4 pb-16 pt-6 font-govuk text-govuk-black md:px-8 md:pb-24 md:pt-12">
      <div className="mx-auto w-full max-w-[42rem]">
        <h1 className="text-[2rem] md:text-[2.5rem] font-bold leading-[1.1] tracking-[-0.01em] text-balance max-w-[30rem]">
          Who&rsquo;s behind this
        </h1>
        <p className={`mt-6 ${body}`}>
          This is being run voluntarily by two people working with the Kincora
          Residents Committee.
        </p>
        <p className={`mt-5 ${body}`}>
          We&rsquo;re service designers, and you can find out more about our work
          at{" "}
          <a href="https://humana.design" className="govuk-link">
            humana.design
          </a>
          .
        </p>
        <p className={`mt-10 ${body}`}>
          <BackToSurvey>Back to the survey</BackToSurvey>
        </p>
      </div>
    </main>
  );
}
