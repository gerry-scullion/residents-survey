import { createFileRoute, Link } from "@tanstack/react-router";
import { body, Page, pageTitle } from "@/components/page";

export const Route = createFileRoute("/thanks")({
  head: () => ({
    meta: [{ title: "Thank you" }, { name: "robots", content: "noindex" }],
  }),
  component: ThankYou,
});

function ThankYou() {
  return (
    <Page>
      <h1 className={pageTitle}>Thank you!</h1>

      <p className={`mt-6 ${body}`}>Your answers have been sent.</p>

      <p className={`mt-5 ${body}`}>
        We&rsquo;ll put together what everyone said and bring it back to the
        committee and to the residents. Everyone sees the same summary,
        including where people disagreed.
      </p>

      <p className={`mt-5 ${body}`}>
        The committee has some money set aside for the area, but no plan for it
        yet. The aim of this survey is to start to understand how people would
        like it to be used.
      </p>

      <p className={`mt-5 ${body}`}>
        Some of what comes up will be the council&rsquo;s responsibility, not
        the committee&rsquo;s. When that happens, we&rsquo;ll tell you and show
        you how to report it to the right place.
      </p>

      <p className={`mt-5 ${body}`}>
        Someone else in your house can fill it in too, on this phone or their
        own.
      </p>

      <Link to="/" className="govuk-button mt-8 block w-full text-center">
        Back to the home page
      </Link>
    </Page>
  );
}
