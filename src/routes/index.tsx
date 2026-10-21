import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { questions, type Question } from "@/questions";
import { submitAnswers, type Answer, type Answers } from "@/lib/submit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What's it like living here?" },
      { name: "description", content: "A few short questions about living on Kincora Avenue, Kincora Grove and Kincora Drive. It takes about five minutes." },
      { property: "og:title", content: "What's it like living here?" },
      { property: "og:description", content: "A few short questions about living on Kincora Avenue, Kincora Grove and Kincora Drive. It takes about five minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "kincora-answers-v1";
const STEP_KEY = "kincora-step-v1";
const SECTIONS_KEY = "kincora-sections-v1";
/** Body copy: 19px minimum, 1.5 line height, measure capped near 70 characters. */
const body = "text-[1.1875rem] leading-[1.5] max-w-[36rem]";
/** Opening paragraph on the introduction pages. */
const lead = "text-[1.3125rem] leading-[1.45] max-w-[34rem]";
/** Page title on the introduction and thank you pages. */
const pageTitle =
  "text-[2rem] md:text-[2.5rem] font-bold leading-[1.1] tracking-[-0.01em] text-balance max-w-[30rem]";
/** Question title. */
const questionTitle =
  "text-[1.75rem] md:text-[2.125rem] font-bold leading-[1.15] tracking-[-0.01em] text-balance max-w-[32rem]";

type Section = {
  id: string;
  title: string;
  description: string;
  questionIds: string[];
};

const sections: Section[] = [
  {
    id: "you",
    title: "You and where you live",
    description: "Where you live, how long you’ve been here and who is at home.",
    questionIds: ["road", "howLong", "household", "hasDog", "age"],
  },
  {
    id: "use",
    title: "How you use the area",
    description: "Where you go when you want to be outside, and what for.",
    questionIds: ["outdoorPlaces", "placeUses", "whyNotUsed", "diyAmenities"],
  },
  {
    id: "fixing",
    title: "Anything that needs fixing",
    description: "Anything around here that needs sorting out, and where.",
    questionIds: ["needsFixing", "fixingLocation"],
  },
  {
    id: "change",
    title: "What’s good, what you’d change",
    description: "What you like about living here and what could be different.",
    questionIds: ["whatIsGood", "looksAfter", "ownIdea", "anythingElse"],
  },
  {
    id: "hearing",
    title: "Hearing back",
    description: "Whether you’d like to hear back from us.",
    questionIds: ["hearingBack"],
  },
];

const isVisible = (id: string, answers: Answers) => {
  const q = questionById(id);
  if (!q?.showIf) return true;
  return answers[q.showIf.questionId]?.selected.includes(q.showIf.includes) ?? false;
};

const questionById = (id: string): Question | undefined =>
  questions.find((q) => q.id === id);

const hasAnswer = (answer?: Answer) =>
  Boolean(answer && (answer.selected.length > 0 || (answer.text ?? "").trim()));

type View =
  | { name: "start" }
  | { name: "hub" }
  | { name: "question"; sectionId: string; index: number; fromCheck?: boolean }
  | { name: "check" }
  | { name: "thanks" };

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="govuk-link block min-h-[2.75rem] py-2 text-left"
      onClick={onClick}
    >
      &lsaquo; Back
    </button>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-govuk-white px-4 pb-8 pt-4 font-govuk text-govuk-black md:px-8 md:pb-16 md:pt-10">
      <div className="mx-auto w-full max-w-[42rem]">
        <div className="min-w-0">{children}</div>
        <footer className="mt-8 border-t border-govuk-black/20 pt-5" aria-label="Help and privacy">
          <p className={`${body}`}>
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

function Index() {
  const [view, setView] = useState<View>({ name: "start" });
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState<string[]>([]);
  const [sendFailed, setSendFailed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers(JSON.parse(saved) as Answers);
      const savedSections = window.localStorage.getItem(SECTIONS_KEY);
      if (savedSections) setCompleted(JSON.parse(savedSections) as string[]);
      const savedStep = window.localStorage.getItem(STEP_KEY);
      if (savedStep) {
        const parsed: unknown = JSON.parse(savedStep);
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof (parsed as View).name === "string"
        ) {
          setView(parsed as View);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* ignore */
    }
  }, [answers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [completed]);

  useEffect(() => {
    try {
      // Don't reopen on the thank you page: someone else in the house may
      // want to fill it in on the same phone.
      if (view.name === "thanks") window.localStorage.removeItem(STEP_KEY);
      else window.localStorage.setItem(STEP_KEY, JSON.stringify(view));
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  }, [view]);

  const markCompleted = (sectionId: string) =>
    setCompleted((prev) =>
      prev.includes(sectionId) ? prev : [...prev, sectionId],
    );

  const finish = () => {
    setSendFailed(false);
    setView({ name: "thanks" });
    submitAnswers(answers)
      .then(() => {
        // Sent, so don't keep the answers on this device.
        setAnswers({});
        setCompleted([]);
      })
      .catch(() => setSendFailed(true));
  };

  if (view.name === "thanks")
    return <ThankYouPage failed={sendFailed} onRetry={finish} />;

  const hub = (
    <HubPage
      answers={answers}
      completed={completed}
      onOpen={(sectionId) => setView({ name: "question", sectionId, index: 0 })}
      onCheck={() => setView({ name: "check" })}
    />
  );

  if (view.name === "check")
    return (
      <CheckAnswersPage
        answers={answers}
        onBack={() => setView({ name: "hub" })}
        onChange={(sectionId, index) =>
          setView({ name: "question", sectionId, index, fromCheck: true })
        }
        onSubmit={finish}
      />
    );

  if (view.name === "question") {
    const section = sections.find((s) => s.id === view.sectionId);
    const questionId = section?.questionIds[view.index];
    const question = questionId ? questionById(questionId) : undefined;

    if (!section || !question) return hub;

    const ids = section.questionIds;
    const findVisible = (from: number, step: 1 | -1) => {
      for (let i = from; i >= 0 && i < ids.length; i += step) {
        const id = ids[i];
        if (id && isVisible(id, answers)) return i;
      }
      return -1;
    };
    const nextIndex = findVisible(view.index + 1, 1);
    const prevIndex = findVisible(view.index - 1, -1);
    const isLast = nextIndex === -1;
    const visibleIds = ids.filter((id) => isVisible(id, answers));

    return (
      <QuestionPage
        key={question.id}
        question={question}
        sectionTitle={section.title}
        index={visibleIds.indexOf(question.id) + 1}
        total={visibleIds.length}
        {...(answers[question.id] ? { answer: answers[question.id] } : {})}
        onChange={(next) =>
          setAnswers((prev) => ({ ...prev, [question.id]: next }))
        }
        onBack={() =>
          view.fromCheck
            ? setView({ name: "check" })
            : prevIndex === -1
              ? setView({ name: "hub" })
              : setView({
                  name: "question",
                  sectionId: section.id,
                  index: prevIndex,
                })
        }
        continueLabel={
          view.fromCheck
            ? "Back to your answers"
            : isLast
              ? "Save and return to the list"
              : "Continue"
        }
        onContinue={() => {
          if (view.fromCheck) {
            setView({ name: "check" });
            return;
          }
          if (isLast) {
            markCompleted(section.id);
            setView({ name: "hub" });
            return;
          }
          setView({
            name: "question",
            sectionId: section.id,
            index: nextIndex,
          });
        }}
      />
    );
  }

  return hub;
}

function statusFor(
  section: Section,
  answers: Answers,
  completed: string[],
): "Completed" | "In progress" | "Not started" {
  if (completed.includes(section.id)) return "Completed";
  const any = section.questionIds.some((id) => hasAnswer(answers[id]));
  return any ? "In progress" : "Not started";
}

function StatusTag({ status }: { status: string }) {
  const base =
    "inline-block whitespace-nowrap px-2 py-1 text-[1rem] font-bold uppercase tracking-[0.02em]";
  if (status === "Completed")
    return <span className={`${base} text-govuk-black`}>{status}</span>;
  return (
    <span className={`${base} border-2 border-govuk-black text-govuk-black`}>
      {status}
    </span>
  );
}

function HubPage({
  answers,
  completed,
  onOpen,
  onCheck,
}: {
  answers: Answers;
  completed: string[];
  onOpen: (sectionId: string) => void;
  onCheck: () => void;
}) {
  const done = sections.filter(
    (s) => statusFor(s, answers, completed) === "Completed",
  ).length;
  const allCompleted = done === sections.length;
  const firstIncomplete = sections.find(
    (section) => statusFor(section, answers, completed) !== "Completed",
  );

  return (
    <Page>
      <h1 className={`${pageTitle} md:max-w-[36rem]`}>
        What&rsquo;s it like living here?
      </h1>

      <p className={`mt-5 ${lead}`}>
        The Kincora Residents Committee wants to know more about what it&rsquo;s
        like to live on Kincora Avenue, Kincora Grove and Kincora Drive, and
        what could be improved.
      </p>

      <p className={`mt-4 ${body}`}>
        We don&rsquo;t ask for your name. You can skip any question. The
        survey should take around five minutes to complete.
      </p>

      <h2 className="mt-10 max-w-[30rem] text-[1.5rem] font-bold leading-[1.2] md:text-[1.875rem]">
        What is in this form
      </h2>

      <p className={`mt-4 ${body}`}>
        There are five short sections. You can answer them in any order, or
        stop and finish the survey later. Every question is optional.
      </p>

      <p className={`mt-3 ${body}`}>
        You’ve completed {done} of {sections.length} sections.
      </p>

      <ul className="mt-7 border-t border-govuk-black/20">
        {sections.map((section) => {
          const status = statusFor(section, answers, completed);
          return (
            <li
              key={section.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-1 border-b border-govuk-black/20 py-4"
            >
              <button
                type="button"
                className="govuk-link min-h-[2.75rem] text-left text-[1.1875rem] font-bold leading-[1.4]"
                onClick={() => onOpen(section.id)}
              >
                {section.title}
              </button>
              <StatusTag status={status} />
              <p className="col-start-1 max-w-[34rem] text-[1rem] leading-[1.5]">
                {section.description}
              </p>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="govuk-button mt-8 w-full"
        onClick={() => {
          if (allCompleted) {
            onCheck();
            return;
          }
          if (firstIncomplete) onOpen(firstIncomplete.id);
        }}
      >
        {allCompleted ? "Check your answers" : "Start"}
      </button>
    </Page>
  );
}

function QuestionPage({
  question,
  sectionTitle,
  index,
  total,
  answer,
  onChange,
  onBack,
  onContinue,
  continueLabel,
}: {
  question: Question;
  sectionTitle: string;
  index: number;
  total: number;
  answer?: Answer | undefined;
  onChange: (next: Answer) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  const selected = answer?.selected ?? [];
  const followUps = answer?.followUps ?? {};
  const extraField = question.extraField;

  const setFollowUp = (label: string, value: string) =>
    onChange({
      selected,
      text: answer?.text,
      followUps: { ...followUps, [label]: value },
    });

  return (
    <Page>
      <BackLink onClick={onBack} />

      <p className={`mt-2 ${body}`}>
        {sectionTitle} · Question {index} of {total}
      </p>

      <h1 className={`mt-3 ${questionTitle}`}>
        {question.title}
      </h1>

      {question.hint ? <p className={`mt-3 ${body}`}>{question.hint}</p> : null}

      <div className="mt-6">
        {question.type === "text" ? (
          <>
            <label htmlFor={question.id} className={`block ${body}`}>
              Your answer
            </label>
            <textarea
              id={question.id}
              rows={6}
              value={answer?.text ?? ""}
              onChange={(e) =>
                onChange({ selected, followUps, text: e.target.value })
              }
              className="govuk-input mt-2 w-full"
            />
          </>
        ) : (
          <fieldset className="border-0 p-0">
            <legend className="sr-only">{question.title}</legend>
            <div className="space-y-2">
              {question.options?.map((option) => {
                const id = `${question.id}-${option.label}`;
                const isChecked = selected.includes(option.label);
                return (
                  <div key={option.label}>
                    <div className="flex items-center gap-3 py-2">
                      <input
                        id={id}
                        type={question.type === "radio" ? "radio" : "checkbox"}
                        name={question.id}
                        checked={isChecked}
                        aria-controls={option.followUp ? `${id}-details` : undefined}
                        aria-expanded={option.followUp ? isChecked : undefined}
                        onChange={(e) => {
                          const next =
                            question.type === "radio"
                              ? [option.label]
                              : e.target.checked
                                ? [...selected, option.label]
                                : selected.filter((s) => s !== option.label);
                          onChange({ selected: next, followUps, text: answer?.text });
                        }}
                        className="govuk-choice"
                      />
                      <label
                        htmlFor={id}
                        className={`min-h-[2.75rem] flex-1 cursor-pointer py-2 ${body}`}
                      >
                        {option.label}
                      </label>
                    </div>

                    {option.followUp && isChecked ? (
                      <div id={`${id}-details`} className="mb-2 ml-11">
                        <label htmlFor={`${id}-text`} className={`block ${body}`}>
                          {option.followUp}
                        </label>
                        <textarea
                          id={`${id}-text`}
                          rows={3}
                          maxLength={1000}
                          value={followUps[option.label] ?? ""}
                          onChange={(e) =>
                            setFollowUp(option.label, e.target.value)
                          }
                          className="govuk-input mt-2 w-full"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {extraField &&
            selected.some((s) => extraField.showWhen.includes(s)) ? (
              <div className="mt-4">
                <label htmlFor={`${question.id}-extra`} className={`block ${body}`}>
                  {extraField.label}
                </label>
                <input
                  id={`${question.id}-extra`}
                  type={extraField.type ?? "text"}
                  value={followUps[extraField.key] ?? ""}
                  onChange={(e) => setFollowUp(extraField.key, e.target.value)}
                  className="govuk-input mt-2 w-full"
                />
              </div>
            ) : null}
          </fieldset>
        )}
      </div>

      <button
        type="button"
        className="govuk-button mt-8 w-full"
        onClick={onContinue}
      >
        {continueLabel}
      </button>
    </Page>
  );
}

function answerText(answer?: Answer) {
  const parts: string[] = [];
  if (answer?.text?.trim()) parts.push(answer.text.trim());
  answer?.selected.forEach((label) => {
    const extra = answer.followUps?.[label];
    parts.push(extra ? `${label}: ${extra}` : label);
  });
  const email = answer?.followUps?.["email"]?.trim();
  if (email && answer?.selected.length) parts.push(email);
  return parts.length ? parts.join(", ") : "Not answered";
}

function CheckAnswersPage({
  answers,
  onBack,
  onChange,
  onSubmit,
}: {
  answers: Answers;
  onBack: () => void;
  onChange: (sectionId: string, index: number) => void;
  onSubmit: () => void;
}) {
  return (
    <Page>
      <BackLink onClick={onBack} />

      <h1 className={`mt-4 ${pageTitle}`}>Check your answers</h1>

      <p className={`mt-5 ${body}`}>
        You can change anything before you send it. Questions you skipped are
        fine to leave.
      </p>

      {sections.map((section) => (
        <section key={section.id} className="mt-10">
          <h2 className="text-[1.5rem] md:text-[1.875rem] font-bold leading-[1.2] tracking-[-0.01em]">
            {section.title}
          </h2>

          <dl className="mt-4 border-t border-govuk-black/20">
            {section.questionIds.map((questionId, index) => {
              const question = questionById(questionId);
              if (!question || !isVisible(questionId, answers)) return null;
              return (
                <div
                  key={questionId}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-govuk-black/20 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <dt className={`font-bold ${body}`}>{question.title}</dt>
                    <dd className={`mt-1 ${body}`}>
                      {answerText(answers[questionId])}
                    </dd>
                  </div>
                  <button
                    type="button"
                    className="govuk-link min-h-[2.75rem] py-1 text-left text-[1.1875rem]"
                    onClick={() => onChange(section.id, index)}
                  >
                    Change
                    <span className="sr-only"> {question.title}</span>
                  </button>
                </div>
              );
            })}
          </dl>
        </section>
      ))}

      <button type="button" className="govuk-button mt-8 w-full" onClick={onSubmit}>
        Send your answers
      </button>
    </Page>
  );
}

function ThankYouPage({
  failed,
  onRetry,
}: {
  failed: boolean;
  onRetry: () => void;
}) {
  return (
    <Page>
      <h1 className={pageTitle}>Thank you!</h1>

      {failed ? (
        <div role="alert" className="mt-5 border-l-[5px] border-govuk-black pl-4">
          <p className={body}>
            We could not send your answers just now. They are still saved on
            this device.
          </p>
          <button type="button" className="govuk-button mt-4 w-full" onClick={onRetry}>
            Try sending again
          </button>
        </div>
      ) : null}

      <p className={`mt-6 ${body}`}>
        We&rsquo;ll put together what everyone said and bring it back to the
        committee and to the residents. Everyone sees the same summary,
        including where people disagreed.
      </p>

      <p className={`mt-5 ${body}`}>
        The committee has some money set aside for the area, but no plan for
        it yet. The aim of this survey is to start to understand how people would like it to be used.
      </p>

      <p className={`mt-5 ${body}`}>
        Some of what comes up will be the council&rsquo;s responsibility, not
        the committee&rsquo;s. When that happens, we&rsquo;ll tell you and
        show you how to report it to the right place.
      </p>

      <p className={`mt-5 ${body}`}>
        <Link to="/about" className="govuk-link">
          A bit about who&rsquo;s behind this
        </Link>
      </p>
    </Page>
  );
}
