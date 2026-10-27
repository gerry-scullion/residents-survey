import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { questions, type Question } from "@/questions";
import { submitAnswers, type Answer, type Answers } from "@/lib/submit";
import { body, Page, pageTitle } from "@/components/page";

/**
 * Where someone is in the survey lives in the address, for example
 * `/?section=use&q=1` or `/?page=check`. Each step is its own entry in the
 * browser history, so the phone's back and forward buttons work.
 */
type Search = { section?: string; q?: number; from?: "check"; page?: "check" };

function validateSearch(raw: Record<string, unknown>): Search {
  const search: Search = {};
  if (raw["page"] === "check") search.page = "check";
  if (typeof raw["section"] === "string") search.section = raw["section"];
  const q = Number(raw["q"]);
  if (Number.isInteger(q) && q > 0) search.q = q;
  if (raw["from"] === "check") search.from = "check";
  return search;
}

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
  validateSearch,
  component: Index,
});

const STORAGE_KEY = "kincora-answers-v1";
/** Older versions saved the current step here; it is now in the address. */
const OLD_STEP_KEY = "kincora-step-v1";
const SECTIONS_KEY = "kincora-sections-v1";
/** Opening paragraph on the introduction pages. */
const lead = "text-[1.3125rem] leading-[1.45] max-w-[34rem]";
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
  | { name: "hub" }
  | { name: "question"; sectionId: string; index: number; fromCheck?: boolean }
  | { name: "check" };

function viewFromSearch(search: Search): View {
  if (search.page === "check") return { name: "check" };
  if (search.section)
    return {
      name: "question",
      sectionId: search.section,
      index: search.q ?? 0,
      fromCheck: search.from === "check",
    };
  return { name: "hub" };
}

function searchFromView(view: View): Search {
  if (view.name === "check") return { page: "check" };
  if (view.name === "question")
    return {
      section: view.sectionId,
      ...(view.index ? { q: view.index } : {}),
      ...(view.fromCheck ? { from: "check" as const } : {}),
    };
  return {};
}

function clearSavedAnswers() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SECTIONS_KEY);
  } catch {
    /* ignore */
  }
}

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

function Index() {
  const navigate = useNavigate();
  const view = viewFromSearch(Route.useSearch());
  const setView = (next: View) =>
    void navigate({ to: "/", search: searchFromView(next) });
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState<string[]>([]);
  // Nothing is saved until the saved answers have been read back, so an
  // empty first render can't overwrite them.
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers(JSON.parse(saved) as Answers);
      const savedSections = window.localStorage.getItem(SECTIONS_KEY);
      if (savedSections) setCompleted(JSON.parse(savedSections) as string[]);
      window.localStorage.removeItem(OLD_STEP_KEY);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [loaded, answers, completed]);

  const viewKey = JSON.stringify(view);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [viewKey]);

  const markCompleted = (sectionId: string) =>
    setCompleted((prev) =>
      prev.includes(sectionId) ? prev : [...prev, sectionId],
    );

  const finish = () => {
    if (sending) return;
    setSending(true);
    setSendFailed(false);
    submitAnswers(answers)
      .then(() => {
        // Sent, so don't keep the answers on this device. Replace the check
        // page in the history so going back can't send them twice.
        clearSavedAnswers();
        setAnswers({});
        setCompleted([]);
        void navigate({ to: "/thanks", replace: true });
      })
      .catch(() => setSendFailed(true))
      .finally(() => setSending(false));
  };

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
        sending={sending}
        failed={sendFailed}
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
        onHub={() => setView({ name: "hub" })}
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
  onHub,
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
  onHub: () => void;
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

      <p className={`mt-6 ${body}`}>
        <button
          type="button"
          className="govuk-link min-h-[2.75rem] py-2 text-left"
          onClick={onHub}
        >
          Go to the list of sections
        </button>
        <span className="block text-[1rem]">Your answers so far are saved.</span>
      </p>
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
  sending,
  failed,
}: {
  answers: Answers;
  onBack: () => void;
  onChange: (sectionId: string, index: number) => void;
  onSubmit: () => void;
  sending: boolean;
  failed: boolean;
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

      {failed ? (
        <div
          role="alert"
          className="mt-8 border-l-[5px] border-govuk-black pl-4"
        >
          <p className={`font-bold ${body}`}>
            Your answers have not been sent
          </p>
          <p className={`mt-2 ${body}`}>
            Something went wrong on our side. Your answers are still saved on
            this phone. Please try again, or come back later.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="govuk-button mt-8 w-full"
        onClick={onSubmit}
        disabled={sending}
        aria-disabled={sending}
      >
        {sending ? "Sending…" : failed ? "Try sending again" : "Send your answers"}
      </button>
    </Page>
  );
}
