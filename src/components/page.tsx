import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Body copy: 19px minimum, 1.5 line height, measure capped near 70 characters. */
export const body = "text-[1.1875rem] leading-[1.5] max-w-[36rem]";

/** Page title on the home, check and thank you pages. */
export const pageTitle =
  "text-[2rem] md:text-[2.5rem] font-bold leading-[1.1] tracking-[-0.01em] text-balance max-w-[30rem]";

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-govuk-white px-4 pb-8 pt-4 font-govuk text-govuk-black md:px-8 md:pb-16 md:pt-10">
      <div className="mx-auto w-full max-w-[42rem]">
        <div className="min-w-0">{children}</div>
        <footer
          className="mt-8 border-t border-govuk-black/20 pt-5"
          aria-label="Help and privacy"
        >
          <p className={body}>
            <Link to="/privacy" className="govuk-link">
              What happens to your answers
            </Link>
          </p>
          <p className={`mt-4 ${body}`}>
            <Link to="/about" className="govuk-link">
              Who’s behind this
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

/**
 * Takes people back to where they were in the survey (the previous page in
 * the browser) or, if they arrived here directly, to the home page.
 * Without JavaScript it is a plain link to the home page.
 */
export function BackToSurvey({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      to="/"
      className="govuk-link"
      onClick={(e) => {
        if (router.history.canGoBack()) {
          e.preventDefault();
          router.history.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
