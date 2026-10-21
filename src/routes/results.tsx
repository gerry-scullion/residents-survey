import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { choiceLabel, followUpsFor } from "@/lib/answer-details";

export const Route = createFileRoute("/results")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Results" },
      { name: "description", content: "Responses to the Kincora survey." },
      { property: "og:title", content: "Results" },
      {
        property: "og:description",
        content: "Responses to the Kincora survey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Results,
});

// TODO: replace with the two real addresses.
const ALLOWED_EMAILS = ["adminkincora@kincora.local"];

const body = "text-[1.1875rem] leading-[1.31579]";

type ResponseRow = Record<string, unknown> & { id: string; submitted_at: string };
type ContactRow = Record<string, unknown> & { id: string };

type Field = { column: string; label: string; kind: "choice" | "text" };

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "You and where you live",
    fields: [
      { column: "road", label: "Road", kind: "choice" },
      { column: "tenure", label: "How long they have lived here", kind: "choice" },
      { column: "household", label: "Who lives in the house", kind: "choice" },
      { column: "has_dog", label: "Has a dog", kind: "choice" },
      { column: "age_band", label: "Age", kind: "choice" },
    ],
  },
  {
    title: "How you use the area",
    fields: [
      { column: "outdoor_places", label: "Local amenities used", kind: "choice" },
      { column: "place_uses", label: "What they use them for", kind: "choice" },
      { column: "why_not_used", label: "Why they do not use them", kind: "text" },
      { column: "local_things", label: "Locally made things used", kind: "choice" },
    ],
  },
  {
    title: "Anything that needs fixing",
    fields: [
      { column: "needs_fixing", label: "What needs fixing", kind: "choice" },
      { column: "fixing_location", label: "Where it is", kind: "text" },
    ],
  },
  {
    title: "What's good, what you'd change",
    fields: [
      { column: "what_is_good", label: "What they like about living here", kind: "text" },
      { column: "looks_after", label: "Does anyone look after shared spaces", kind: "choice" },
      { column: "looks_after_detail", label: "Who looks after them", kind: "text" },
      { column: "one_change", label: "What they would change", kind: "text" },
      { column: "anything_else", label: "Anything else", kind: "text" },
    ],
  },
];

const ALL_FIELDS: Field[] = [
  { column: "submitted_at", label: "Submitted", kind: "text" },
  ...SECTIONS.flatMap((s) => s.fields),
];
const RESPONSE_COLUMNS = ALL_FIELDS.map((f) => f.column);
const RESPONSE_HEADERS = ALL_FIELDS.map((f) => f.label);

function detailedValue(row: Record<string, unknown>, column: string): string {
  const details = followUpsFor(row, column);
  return values(row, column).map((value) => details[value] ? `${value}: ${details[value]}` : value).join("; ");
}

function valueOf(row: Record<string, unknown>, column: string): unknown {
  const v = row[column];
  if (column === "local_things" && (v === null || (Array.isArray(v) && v.length === 0))) {
    return row["diy_amenities"];
  }
  return v;
}

function values(row: Record<string, unknown>, column: string): string[] {
  const v = valueOf(row, column);
  if (v === null || v === undefined || v === "") return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)];
}

function formatDate(value: unknown): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CONTACT_HEADERS = ["Date", "Email", "Wants the summary", "Wants a copy of their answers", "Wants updates"];
const CONTACT_COLUMNS = ["created_at", "email", "wants_summary", "wants_own_copy", "wants_updates"];

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

function toCsv(columns: string[], rows: Record<string, unknown>[], headers: string[] = columns): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((row) => {
    lines.push(
      columns
        .map((c) => {
          const v = valueOf(row, c);
          if (typeof v === "boolean") return escape(v ? "Yes" : "No");
          return escape(Object.keys(followUpsFor(row, c)).length ? detailedValue(row, c) : cell(v));
        })
        .join(","),
    );
  });
  return lines.join("\n");
}

function download(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Results() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-govuk-white px-4 pb-16 pt-6 font-govuk text-govuk-black">
      <div className="max-w-[60rem]">
        <h1 className="text-[2rem] font-bold leading-[1.15] md:text-[3rem]">
          Results
        </h1>

        {!ready ? null : !email ? (
          <SignIn />
        ) : !ALLOWED_EMAILS.includes(email.toLowerCase()) ? (
          <>
            <p className={`mt-6 ${body}`}>
              This account does not have access.
            </p>
            <SignOut />
          </>
        ) : (
          <>
            <Data />
            <SignOut />
          </>
        )}
      </div>
    </main>
  );
}

function SignOut() {
  return (
    <p className={`mt-10 ${body}`}>
      <button
        type="button"
        className="govuk-link"
        onClick={() => supabase.auth.signOut()}
      >
        Sign out
      </button>
    </p>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const username = email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${username}@kincora.local`,
      password,
    });
    if (signInError) setError("Username or password is not right.");
  };

  return (
    <form onSubmit={submit} className="mt-6 max-w-[40rem]">
      <label htmlFor="email" className={`block ${body}`}>
        Username
      </label>
      <input
        id="email"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="govuk-input mt-2 w-full"
      />

      <label htmlFor="password" className={`mt-6 block ${body}`}>
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="govuk-input mt-2 w-full"
      />

      {error ? <p className={`mt-4 ${body}`}>{error}</p> : null}

      <button type="submit" className="govuk-button mt-8 w-full">
        Sign in
      </button>
    </form>
  );
}

function Data() {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([
      supabase.from("responses").select("*").order("submitted_at", { ascending: false }),
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    ]);
    if (r.error) setError(r.error.message);
    else setResponses((r.data ?? []) as ResponseRow[]);
    if (!r.error && c.error) setError(c.error.message);
    else if (!c.error) setContacts((c.data ?? []) as ContactRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const answered = (column: string) =>
    responses.filter((r) => values(r, column).length > 0).length;

  return (
    <>
      {error ? <p className={`mt-6 ${body}`} role="alert">{error}</p> : null}

      <h2 className="mt-8 text-[1.5rem] font-bold leading-[1.25] md:text-[2.25rem]">Summary</h2>
      <dl className={`mt-4 ${body}`}>
        <div className="flex gap-4 border-b border-govuk-black py-3">
          <dt className="w-2/3 font-bold">Responses</dt>
          <dd>{responses.length}</dd>
        </div>
        <div className="flex gap-4 border-b border-govuk-black py-3">
          <dt className="w-2/3 font-bold">People asking to hear back</dt>
          <dd>{contacts.length}</dd>
        </div>
      </dl>

      <h2 className="mt-10 text-[1.5rem] font-bold leading-[1.25] md:text-[2.25rem]">Download</h2>
      <p className={`mt-2 ${body}`}>Spreadsheet files you can open in Excel or Google Sheets. Emails are kept in a separate file and are not linked to answers.</p>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <button type="button" className="govuk-button w-full sm:w-auto"
          onClick={() => download("kincora-answers.csv", toCsv(RESPONSE_COLUMNS, responses, RESPONSE_HEADERS))}>
          Download answers
        </button>
        <button type="button" className="govuk-button w-full sm:w-auto"
          onClick={() => download("kincora-emails.csv", toCsv(CONTACT_COLUMNS, contacts, CONTACT_HEADERS))}>
          Download emails
        </button>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-12">
          <h2 className="text-[1.5rem] font-bold leading-[1.25] md:text-[2.25rem]">{section.title}</h2>
          {section.fields.map((field) => {
            const count = answered(field.column);
            if (field.kind === "choice") {
              const tally: Record<string, number> = {};
              responses.forEach((r) => values(r, field.column).forEach((v) => {
                const label = choiceLabel(field.column, v);
                tally[label] = (tally[label] ?? 0) + 1;
              }));
              const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
              const details = responses.flatMap((r) => Object.entries(followUpsFor(r, field.column)).map(([label, text]) => ({ id: r.id, label, text })));
              return (
                <div key={field.column} className="mt-8">
                  <table className={`w-full border-collapse text-left ${body}`}>
                    <caption className="mb-2 text-left text-[1.1875rem] font-bold">
                      {field.label} <span className="font-normal">({count} answered)</span>
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="border-b-2 border-govuk-black py-2 pr-4 font-bold">Answer</th>
                        <th scope="col" className="border-b-2 border-govuk-black py-2 text-right font-bold">People</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan={2} className="border-b border-govuk-black py-2">No answers yet</td></tr>
                      ) : rows.map(([answer, n]) => (
                        <tr key={answer}>
                          <th scope="row" className="border-b border-govuk-black py-2 pr-4 font-normal">{answer}</th>
                          <td className="border-b border-govuk-black py-2 text-right">{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {details.length > 0 ? (
                    <details className="mt-4">
                      <summary className={`cursor-pointer font-bold underline ${body}`}>Additional answers ({details.length})</summary>
                      <ul className={`mt-3 border-l-4 border-govuk-black pl-4 ${body}`}>
                        {details.map(({ id, label, text }) => (
                          <li key={`${id}-${label}`} className="border-b border-govuk-black py-3 whitespace-pre-wrap break-words"><strong>{label}:</strong> {text}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              );
            }
            const texts = responses.flatMap((r) => values(r, field.column).map((t) => ({ id: r.id, t })));
            return (
              <details key={field.column} className="mt-8">
                <summary className={`cursor-pointer font-bold underline ${body}`}>
                  {field.label} ({count} answered)
                </summary>
                {texts.length === 0 ? (
                  <p className={`mt-3 ${body}`}>No answers yet</p>
                ) : (
                  <ul className={`mt-3 border-l-4 border-govuk-black pl-4 ${body}`}>
                    {texts.map(({ id, t }) => (
                      <li key={id} className="border-b border-govuk-black py-3 whitespace-pre-wrap">{t}</li>
                    ))}
                  </ul>
                )}
              </details>
            );
          })}
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-[1.5rem] font-bold leading-[1.25] md:text-[2.25rem]">Each response</h2>
        <p className={`mt-2 ${body}`}>Newest first. Open one to read everything that person said.</p>
        {responses.map((row, i) => (
          <details key={row.id} className="mt-4 border-b border-govuk-black pb-4">
            <summary className={`cursor-pointer font-bold underline ${body}`}>
              Response {responses.length - i}: {formatDate(row.submitted_at)}
              {values(row, "road")[0] ? `, ${values(row, "road")[0]}` : ""}
            </summary>
            <dl className={`mt-3 ${body}`}>
              {SECTIONS.flatMap((s) => s.fields).map((f) => (
                <div key={f.column} className="border-b border-govuk-black/0 py-2 sm:flex sm:gap-4">
                  <dt className="font-bold sm:w-1/3">{f.label}</dt>
                  <dd className="whitespace-pre-wrap break-words sm:w-2/3">{detailedValue(row, f.column) || "Not answered"}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </section>
    </>
  );
}
