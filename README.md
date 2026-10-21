# Clontarf survey

A short, deliberately easy to navigate website that asks people living on Kincora Avenue, Kincora Grove and Kincora Drive what it is like to live there and what they think about the green.

The link gets shared into the local WhatsApp groups. Responses get synthesised and brought back to the residents' committee and to the three roads. Nothing on the site proposes anything or decides anything.

Built by Fionn O Lochlainn and Gerry Scullion, Humana Design.

The visual style follows the GOV.UK Design System, and the plainness is the design.

The people we need to hear from are mostly long-term residents in their sixties and older, and younger families reading on a phone while doing something else. The style is built and tested for exactly that span: black on white, one typeface, huge tap targets, one question per screen, nothing competing with the content.


Body text 19px minimum. Never grey text on white.
No font weight below 400.
Must survive browser text scaled to 200%.
Mobile first, one-handed phone use.
One question per page. One full-width button, 44px tall minimum.
Every question skippable. No required fields, no validation errors on blanks.
Labels above inputs, never placeholder text as a label.
Real semantic HTML so screen readers work.
Page readable with JavaScript disabled where possible.
A "talk to a person instead" route at the bottom of every page.

Plain language throughout. No jargon, including ours: not "consultation", not "stakeholder", not "engagement".

Privacy rules

This collects information about households on three small, named streets. That is small enough that a household can be identified from a handful of answers, so the handling is deliberately strict.

No response data in this repo. Ever. No CSV exports, no test dumps containing real answers. *.csv is gitignored.
The responses and contacts tables must never be joined. No foreign key, no shared id. An email address next to a household description on a road this size is a named neighbour talking about their neighbours.
Never commit the Supabase service role key. It bypasses row level security. It lives in Lovable's secrets. The anon key in client code is fine.
Anonymous users get INSERT only. No SELECT, no UPDATE, no DELETE through the app.
We do not collect names, house numbers, IP addresses or analytics of any kind.
The committee sees the synthesis, not the raw responses.



## Netlify Forms

Answers are sent to Netlify Forms as two separate forms, `survey` and `contact`, so an email address is never stored next to a set of answers. They are also saved to Supabase when it is connected; either one succeeding counts as sent.

Netlify can only find forms in static HTML, and this app is rendered by JavaScript, so the forms are declared in `public/__forms.html` and the app posts to that file. If you add or rename a question field, update that file too. `bun test` fails if the two drift apart.

After the first deploy, turn on form detection in the Netlify dashboard (Forms > Enable form detection) and redeploy. Set up email notifications there if you want them.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5f654d89-8440-4e65-8637-7567bc533c13).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
