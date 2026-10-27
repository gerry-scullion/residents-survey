import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { body, Page, pageTitle } from "@/components/page";
import { cleanEmail } from "@/lib/response";
import { NETLIFY_FORMS_PATH, submitEmail } from "@/lib/submit";

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
        We&rsquo;ll read every answer by the end of November and write a report
        for the Kincora Residents Committee, to help plan for 2027.
      </p>

      <h2 className="mt-10 text-[1.5rem] font-bold leading-[1.2] md:text-[1.875rem]">
        Get a copy of the report
      </h2>

      <ReportSignUp />

      <p className={`mt-10 ${body}`}>
        <Link to="/" className="govuk-link">
          Back to the home page
        </Link>
      </p>
    </Page>
  );
}

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * Optional email sign-up. It is sent separately from the answers, so the two
 * can't be matched. Without JavaScript it still posts straight to Netlify.
 */
function ReportSignUp() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [invalid, setInvalid] = useState(false);

  if (status === "sent")
    return (
      <p role="status" className={`mt-4 ${body}`}>
        Thanks. We&rsquo;ll email you the report when it&rsquo;s ready.
      </p>
    );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const clean = cleanEmail(email);
    setInvalid(!clean);
    if (!clean) return;
    setStatus("sending");
    submitEmail(clean)
      .then(() => setStatus("sent"))
      .catch(() => setStatus("failed"));
  };

  return (
    <form
      method="POST"
      action={NETLIFY_FORMS_PATH}
      noValidate
      onSubmit={onSubmit}
      className="mt-4"
    >
      <input type="hidden" name="form-name" value="contact" />

      <p className={body}>
        If you&rsquo;d like a copy, leave your email address and we&rsquo;ll
        send it to you. It&rsquo;s kept apart from your answers and we&rsquo;ll
        only use it to send you the report.
      </p>

      <div
        className={
          invalid ? "mt-5 border-l-[5px] border-govuk-black pl-4" : "mt-5"
        }
      >
        <label htmlFor="report-email" className={`block font-bold ${body}`}>
          Your email address
        </label>
        {invalid ? (
          <p id="report-email-error" className={`mt-1 font-bold ${body}`}>
            Enter an email address, like name@example.com
          </p>
        ) : null}
        <input
          id="report-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={invalid ? "report-email-error" : undefined}
          aria-invalid={invalid || undefined}
          className="govuk-input mt-2 w-full"
        />
      </div>

      {status === "failed" ? (
        <p role="alert" className={`mt-4 ${body}`}>
          Sorry, that didn&rsquo;t go through. Please try again.
        </p>
      ) : null}

      <button
        type="submit"
        className="govuk-button mt-5 w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send me the report"}
      </button>
    </form>
  );
}
