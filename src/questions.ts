export type Option = {
  label: string;
  /** Optional free-text follow-up shown when this option is chosen. */
  followUp?: string;
};

export type Question = {
  id: string;
  title: string;
  hint?: string;
  type: "radio" | "checkbox" | "text";
  options?: Option[];
  /** Only show this question when another answer includes this option. */
  showIf?: { questionId: string; includes: string };
};

const many = "Tick as many as you like.";

export const questions: Question[] = [
  {
    id: "road",
    title: "Which road do you live on?",
    type: "radio",
    options: [
      { label: "Kincora Avenue" },
      { label: "Kincora Grove" },
      { label: "Kincora Drive" },
      { label: "Nearby, not one of these three", followUp: "Which road? (optional)" },
    ],
  },
  {
    id: "howLong",
    title: "How long have you lived here?",
    type: "radio",
    options: [
      { label: "Less than 2 years" },
      { label: "2 to 10 years" },
      { label: "10 to 25 years" },
      { label: "More than 25 years" },
    ],
  },
  {
    id: "household",
    title: "Who lives in your house?",
    hint: many,
    type: "checkbox",
    options: [
      { label: "Just adults" },
      { label: "Children under 5" },
      { label: "Children 5 to 12" },
      { label: "Teenagers" },
      { label: "Someone over 75" },
      { label: "Someone who finds it hard to get out" },
    ],
  },
  {
    id: "hasDog",
    title: "Do you have a dog?",
    type: "radio",
    options: [{ label: "Yes" }, { label: "No" }],
  },
  {
    id: "age",
    title: "How old are you?",
    type: "radio",
    options: [
      { label: "Under 30" },
      { label: "30 to 44" },
      { label: "45 to 59" },
      { label: "60 to 74" },
      { label: "75 or over" },
    ],
  },
  {
    id: "outdoorPlaces",
    title: "Which of these local amenities do you use?",
    hint: many,
    type: "checkbox",
    options: [
      { label: "St Anne's Park" },
      { label: "The seafront" },
      { label: "The green" },
      { label: "Somewhere else nearby", followUp: "Where else? (optional)" },
      { label: "None of these", followUp: "Tell us more (optional)" },
    ],
  },
  {
    id: "placeUses",
    title: "What do you use them for?",
    hint: many,
    type: "checkbox",
    options: [
      { label: "Walking" },
      { label: "Walking the dog" },
      { label: "The kids play there" },
      { label: "Football" },
      { label: "Sitting out" },
      { label: "Meeting people" },
      { label: "Something else", followUp: "What else do you use them for? (optional)" },
    ],
  },
  {
    id: "whyNotUsed",
    title: "Why not?",
    type: "text",
    showIf: { questionId: "outdoorPlaces", includes: "None of these" },
  },
  {
    id: "diyAmenities",
    title: "Have you used any of these?",
    hint: many,
    type: "checkbox",
    options: [
      { label: "The book box" },
      { label: "The goals on the green" },
      { label: "The swing on the tree" },
      { label: "No", followUp: "Tell us more (optional)" },
      { label: "Didn't know they were there", followUp: "Tell us more (optional)" },
    ],
  },
  {
    id: "needsFixing",
    title: "Does anything in the area need to be fixed?",
    hint: many,
    type: "checkbox",
    options: [
      { label: "Pavements" },
      { label: "Kerbs" },
      { label: "Street lights" },
      { label: "Bins and litter" },
      { label: "Dog mess" },
      { label: "Nowhere to sit" },
      { label: "Parking" },
      { label: "Overgrown areas" },
      { label: "Something else", followUp: "What else needs fixing? (optional)" },
      { label: "No", followUp: "Tell us more (optional)" },
    ],
  },
  {
    id: "fixingLocation",
    title: "Where is it?",
    hint: "A road name is enough.",
    type: "text",
  },
  {
    id: "whatIsGood",
    title: "What do you like about living here?",
    type: "text",
  },
  {
    id: "looksAfter",
    title: "Does anyone help look after the shared spaces?",
    hint: "For example, do people who live here look after the green, the paths or the planters, rather than the council?",
    type: "radio",
    options: [
      { label: "I do, a bit" },
      { label: "Yes, someone else does", followUp: "Who?" },
      { label: "Not that I know of", followUp: "Tell us more (optional)" },
      { label: "Not sure", followUp: "Tell us more (optional)" },
    ],
  },
  {
    id: "ownIdea",
    title: "Is there anything you would change?",
    type: "text",
  },
  {
    id: "anythingElse",
    title: "Anything else?",
    type: "text",
  },
];
