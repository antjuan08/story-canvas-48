export type TierId = "storyteller" | "pro" | "creator";

export type TierLimits = {
  stories: number;     // -1 = unlimited
  keynotes: number;
  podcasts: number;
  books: number;
  reimagined: boolean; // feature gate
  community: boolean;
  brandVoice: boolean;
  pdfExport: boolean;
};

export const TIER_LIMITS: Record<TierId, TierLimits> = {
  storyteller: {
    stories: -1, keynotes: 3, podcasts: 3, books: 1,
    reimagined: false, community: true, brandVoice: true, pdfExport: true,
  },
  pro: {
    stories: -1, keynotes: 10, podcasts: -1, books: -1,
    reimagined: false, community: true, brandVoice: true, pdfExport: true,
  },
  creator: {
    stories: -1, keynotes: -1, podcasts: -1, books: -1,
    reimagined: true, community: true, brandVoice: true, pdfExport: true,
  },
};

export type TierPlan = {
  id: TierId;
  name: string;
  tagline: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyAmount: number;
  yearlyAmount: number;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: TierPlan[] = [
  {
    id: "storyteller",
    name: "Scribe",
    tagline: "Where every voice begins — stories, books & community.",
    monthlyPriceId: "storyteller_monthly",
    yearlyPriceId: "storyteller_yearly",
    monthlyAmount: 5,
    yearlyAmount: 50,
    features: [
      "Unlimited stories",
      "3 keynotes & talks / month",
      "3 podcast episodes / month",
      "1 book / month",
      "Community: read, post & license stories",
      "Sermon templates",
      "Brand voice & PDF export",
    ],
  },
  {
    id: "pro",
    name: "Storyteller",
    tagline: "For pastors, teachers & speakers in rhythm.",
    monthlyPriceId: "pro_monthly",
    yearlyPriceId: "pro_yearly",
    monthlyAmount: 10,
    yearlyAmount: 100,
    highlighted: true,
    features: [
      "Unlimited stories",
      "10 keynotes & talks / month",
      "Unlimited podcasts",
      "Unlimited books",
      "Community: read, post & license stories",
      "Sermon templates",
      "Brand voice & PDF export",
    ],
  },
  {
    id: "creator",
    name: "Reimagined",
    tagline: "Everything, plus cinematic Reimagined renders.",
    monthlyPriceId: "creator_monthly",
    yearlyPriceId: "creator_yearly",
    monthlyAmount: 20,
    yearlyAmount: 200,
    features: [
      "Unlimited everything",
      "Reimagined cinematic generation",
      "Pay-per-render credit packs",
      "Priority AI rendering",
      "Community: read, post & license stories",
      "Sermon templates",
      "Brand voice & PDF export",
    ],
  },
];

export const CREDIT_PACKS = [
  { id: "credits_20", credits: 20, amount: 10, label: "Starter" },
  { id: "credits_50", credits: 50, amount: 20, label: "Studio" },
  { id: "credits_200", credits: 200, amount: 60, label: "Reel" },
];
