import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/pages/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | American Jews for Democracy",
  description:
    "How American Jews for Democracy collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "June 10, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        American Jews for Democracy (&quot;AJD,&quot; &quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy
        Policy explains how we collect, use, disclose, and safeguard information
        when you visit our website or interact with us, including when you sign
        up to volunteer or receive updates.
      </p>

      <LegalSection title="Information We Collect">
        <p>
          We may collect information that you provide directly to us, such as
          your name, email address, phone number, state(s) of residence,
          congressional district, and any other information you choose to
          submit through our forms.
        </p>
        <p>
          We may also automatically collect certain technical information when
          you use our website, such as your browser type, device type, pages
          visited, and referring URLs. We use privacy-friendly analytics to
          understand how our site is used.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Process sign-ups and maintain your account or volunteer profile</li>
          <li>
            Send you updates, event information, and other communications you
            have requested or consented to receive
          </li>
          <li>
            Send transactional messages, such as email verification links,
            account update links, or one-time verification codes you request
          </li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>Improve our website, programs, and outreach efforts</li>
          <li>Comply with legal obligations and protect our rights</li>
        </ul>
      </LegalSection>

      <LegalSection title="Communications">
        <p>
          If you provide a phone number, you may receive limited text messages
          from us, typically fewer than one per month, about AJD activities and
          updates. Message and data rates may apply.
        </p>
        <p>
          You may opt out of text messages at any time by replying STOP to any
          message from us. After you opt out, we will not send you any further
          text messages, including updates and one-time verification codes,
          unless you re-subscribe by replying START.
        </p>
        <p>
          You may unsubscribe from marketing emails by using the unsubscribe
          link in any email we send. As with text messages, we may still send
          transactional emails when needed to fulfill a request you make, such
          as confirming your email address or sending a secure update link.
        </p>
        <p>
          For more detail on communications and consent, please see our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="How We Share Information">
        <p>
          We do not sell your personal information. We may share information
          with service providers who help us operate our website and
          communications (for example, email and SMS delivery providers),
          subject to appropriate confidentiality and security obligations. We
          may also disclose information if required by law or to protect the
          rights, safety, and security of AJD, our users, or others.
        </p>
        <p>
          We do not sell or share your personal information with third parties
          or affiliates for their own marketing or promotional purposes. We do
          not share your text messaging opt-in or consent data with any third
          parties or affiliates for any purpose. The phone number you provide
          and your consent to receive text messages are used solely by AJD to
          send the messages you have requested.
        </p>
      </LegalSection>

      <LegalSection title="Data Retention">
        <p>
          We retain personal information for as long as needed to provide our
          services, communicate with you, comply with legal obligations,
          resolve disputes, and enforce our agreements. When information is no
          longer needed for these purposes, we will delete or anonymize it
          where practicable.
        </p>
      </LegalSection>

      <LegalSection title="Your Choices">
        <p>
          You may review or update certain information by using the update
          links we provide or by contacting us. You may opt out of marketing
          communications as described above. Depending on where you live, you
          may have additional rights regarding your personal information under
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use reasonable administrative, technical, and organizational
          measures designed to protect personal information. However, no method
          of transmission over the internet or electronic storage is completely
          secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Our website is not directed to children under 13, and we do not
          knowingly collect personal information from children under 13. If you
          believe we have collected such information, please contact us so we
          can delete it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the
          revised policy on this page and update the &quot;Last updated&quot;
          date above. Your continued use of our website after changes become
          effective constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>
          If you have questions about this Privacy Policy or our data practices,
          please contact us through our{" "}
          <Link href="/join-us" className="text-primary hover:underline">
            Join Us
          </Link>{" "}
          page or other contact methods we make available on our website.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
