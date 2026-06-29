import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

const EFFECTIVE_DATE = "June 29, 2026";
const COMPANY = "Storyou LLC";
const CONTACT = "legal@storyou.ai";

function LegalShell({
  title,
  description,
  path,
  children,
}: {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM, color: INK }}>
      <SEO title={`${title} — Storyou`} description={description} path={path} />
      <header className="max-w-3xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-2xl grid place-items-center font-serif text-base"
            style={{ backgroundColor: INK, color: CREAM }}
          >
            S
          </div>
          <span className="font-serif text-xl tracking-tight">Storyou</span>
        </Link>
        <Link to="/" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          ← Back home
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 pb-24">
        <h1 className="font-serif text-4xl font-light tracking-tight leading-tight mb-2">{title}</h1>
        <p className="text-xs uppercase tracking-wide text-foreground/50 mb-2">Last updated: {EFFECTIVE_DATE}</p>
        <p className="text-xs italic text-foreground/50 mb-10">
          Template content for review by qualified legal counsel before launch. Not legal advice.
        </p>
        <article className="prose prose-sm sm:prose-base max-w-none font-sans leading-relaxed [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-light [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_a]:underline">
          {children}
        </article>
        <div className="mt-16 pt-6 border-t border-foreground/10 flex items-center justify-between text-xs text-foreground/50">
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <span>© 2026 {COMPANY}</span>
        </div>
      </main>
    </div>
  );
}

export function Terms() {
  return (
    <LegalShell
      title="Terms of Service"
      description="The terms governing your use of Storyou."
      path="/terms"
    >
      <p>
        Welcome to Storyou. These Terms of Service ("Terms") govern your access to and use of the websites,
        applications, and services (collectively, the "Service") provided by {COMPANY} ("Storyou," "we," "us,"
        or "our"). By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. Eligibility & Accounts</h2>
      <p>
        You must be at least 13 years old (or the minimum age required in your jurisdiction) to use the Service.
        You are responsible for keeping your account credentials confidential and for all activity that occurs
        under your account.
      </p>

      <h2>2. Your Content</h2>
      <p>
        The Service lets you record audio, upload media (images, video, audio), and generate text, keynotes,
        podcasts, books, and other derivative works ("Your Content"). You retain all ownership rights in Your
        Content. You grant Storyou a worldwide, non-exclusive, royalty-free license to host, store, process,
        transmit, and display Your Content solely for the purpose of operating and improving the Service.
      </p>
      <p>
        You represent that you have all rights necessary to upload Your Content and that it does not violate any
        law or third-party right.
      </p>

      <h2>3. AI Features</h2>
      <p>
        Storyou uses third-party artificial intelligence providers to transcribe, refine, summarize, generate
        media, and provide coaching feedback. AI output may be inaccurate, incomplete, or unsuitable for a
        particular purpose. You are responsible for reviewing AI output before relying on or publishing it.
      </p>

      <h2>4. Acceptable Use</h2>
      <ul>
        <li>No unlawful, harassing, defamatory, infringing, or deceptive content.</li>
        <li>No attempts to reverse engineer, disrupt, or overload the Service.</li>
        <li>No use of the Service to train competing AI models without our written consent.</li>
        <li>No uploading of content you do not have the right to share.</li>
      </ul>

      <h2>5. Subscriptions, Trials & Billing</h2>
      <p>
        Paid plans and credit packs are billed through Stripe. By subscribing, you authorize recurring charges
        until you cancel. Free trials convert automatically unless cancelled before the trial ends. Fees are
        non-refundable except where required by law. We may change pricing on prospective renewal terms with
        notice.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may cancel at any time from your account settings. We may suspend or terminate access for violation
        of these Terms or for risk to the Service. Upon termination, your right to use the Service ends, though
        certain provisions (ownership, disclaimers, liability) survive.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, {COMPANY.toUpperCase()} WILL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUES, OR DATA. OUR
        TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE AMOUNTS YOU PAID FOR THE SERVICE IN THE 12 MONTHS
        BEFORE THE CLAIM.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to indemnify and hold {COMPANY} harmless from claims arising out of Your Content or your
        misuse of the Service.
      </p>

      <h2>10. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated through the Service
        or by email. Continued use after the effective date constitutes acceptance.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-laws
        principles. Disputes will be resolved exclusively in the state or federal courts located in Delaware,
        unless otherwise required by applicable consumer law.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalShell>
  );
}

export function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="How Storyou collects, uses, and protects your information."
      path="/privacy"
    >
      <p>
        This Privacy Policy explains how {COMPANY} ("Storyou," "we") collects, uses, and shares information when
        you use our website and services (the "Service").
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, password hash, and profile preferences you
          provide at sign-up or in settings.
        </li>
        <li>
          <strong>Audio recordings:</strong> voice recordings you create within the Service for transcription,
          coaching, and AI refinement.
        </li>
        <li>
          <strong>Uploaded media:</strong> images, video, audio, and documents you choose to upload.
        </li>
        <li>
          <strong>Generated content:</strong> stories, keynotes, podcasts, books, and reimagined renders
          produced from your inputs.
        </li>
        <li>
          <strong>Usage data:</strong> log data, device and browser information, pages visited, feature
          interactions, and approximate location derived from IP address.
        </li>
        <li>
          <strong>Billing data:</strong> subscription tier, plan history, and credit balance. Payment card
          details are collected and stored by Stripe — we never see or store full card numbers.
        </li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>To deliver the core Service: storing, organizing, and rendering your content.</li>
        <li>To run AI processing such as transcription, refinement, coaching, and media generation.</li>
        <li>To operate billing, trials, and credit accounting.</li>
        <li>To improve product quality, debug issues, and protect against abuse.</li>
        <li>To communicate with you about account, security, and product updates.</li>
      </ul>

      <h2>3. Third-Party Processors</h2>
      <p>We share data with vetted third-party processors who help us operate the Service:</p>
      <ul>
        <li>
          <strong>Database, authentication, and storage:</strong> our managed backend infrastructure provider
          stores account data, uploaded media, and generated content.
        </li>
        <li>
          <strong>Payments:</strong> Stripe processes payments, subscriptions, and credit purchases.
        </li>
        <li>
          <strong>AI providers:</strong> we send relevant text, audio, and media to AI model providers (for
          example, large language model and speech-to-text providers, and image/video generation providers) to
          produce the AI features you request. These providers process inputs to return outputs and, per our
          contracts, do not use your inputs to train their public models.
        </li>
        <li>
          <strong>Analytics and email:</strong> limited service operations such as error monitoring and
          transactional email delivery.
        </li>
      </ul>

      <h2>4. Storage & Retention</h2>
      <p>
        Your content is retained while your account is active. You may delete individual recordings, stories,
        media, and generated outputs at any time from within the Service. When you delete your account, we
        delete or anonymize personal data within a commercially reasonable period, except where retention is
        required by law (e.g., tax/financial records) or for fraud prevention.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, export, or delete the personal data
        we hold about you, and to object to or restrict certain processing. To exercise these rights, email{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We will respond within the time required by applicable law.
      </p>

      <h2>6. Cookies & Similar Technologies</h2>
      <p>
        We use cookies and local storage to keep you signed in, remember preferences, and measure aggregate
        usage. You can control cookies through your browser settings; disabling them may impact functionality.
      </p>

      <h2>7. Security</h2>
      <p>
        We use technical and organizational safeguards including encryption in transit, access controls, and
        row-level authorization for stored data. No system is perfectly secure; please use a strong password and
        notify us promptly if you suspect unauthorized access.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed to children under 13 (or the equivalent minimum age in your jurisdiction).
        We do not knowingly collect personal information from children.
      </p>

      <h2>9. International Transfers</h2>
      <p>
        Your data may be processed in the United States and other countries where our processors operate. We
        rely on lawful transfer mechanisms where required.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Privacy Policy. Material changes will be communicated through the Service or by
        email. The "Last updated" date above reflects the latest version.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions or requests? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalShell>
  );
}
