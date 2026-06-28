import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/pages/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms and Conditions | American Jews for Democracy",
  description:
    "Terms and conditions governing your use of the American Jews for Democracy website and communications.",
};

const LAST_UPDATED = "June 10, 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms and Conditions" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms and Conditions (&quot;Terms&quot;) govern your access to and
        use of the website operated by American Jews for Democracy
        (&quot;AJD,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        By using our website or submitting information to us, you agree to these
        Terms. If you do not agree, please do not use our website.
      </p>

      <LegalSection title="Use of Our Website">
        <p>
          You may use our website only for lawful purposes and in accordance
          with these Terms. You agree not to misuse the site, attempt to gain
          unauthorized access to our systems, interfere with the proper
          functioning of the site, or use the site in any way that could harm
          AJD, our users, or third parties.
        </p>
      </LegalSection>

      <LegalSection title="Sign-Up and Submitted Information">
        <p>
          When you submit information through our forms, you represent that the
          information is accurate to the best of your knowledge and that you
          have the right to provide it. You are responsible for keeping your
          contact information current.
        </p>
        <p>
          Submitting a sign-up or update form does not create an employment,
          agency, or partnership relationship with AJD.
        </p>
      </LegalSection>

      <LegalSection title="Communications and Consent">
        <p>
          By providing your email address and/or phone number, you consent to
          receive communications from AJD related to your sign-up, volunteer
          activities, and the programs you have joined.
        </p>
        <p>
          <strong className="text-white/90 font-sans font-medium">
            Text messages.
          </strong>{" "}
          If you provide a phone number, you agree to receive text messages from
          us, such as updates about AJD news, events, and opportunities
          (typically fewer than one per month) and one-time verification codes or
          account update links that you request. Message frequency varies.
          Message and data rates may apply. You may opt out at any time by
          replying STOP to any message from us. After we process your opt-out
          request, we will not send you any further text messages, including
          updates and one-time codes, unless you re-subscribe by replying START.
          For help, reply HELP.
        </p>
        <p>
          You may also opt out of marketing emails by using the unsubscribe
          link included in our emails. Opting out of communications does not
          affect your ability to use our website or remain signed up with AJD.
        </p>
        <p>
          For information about how we handle personal data, please see our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          The content on our website, including text, graphics, logos, and
          design, is owned by AJD or our licensors and is protected by
          applicable intellectual property laws. You may not copy, modify,
          distribute, or exploit our content without our prior written consent,
          except as permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Links">
        <p>
          Our website may contain links to third-party websites or services. We
          are not responsible for the content, policies, or practices of third
          parties. Accessing third-party sites is at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          Our website and materials are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. To the fullest extent permitted by
          law, AJD disclaims all warranties, express or implied, regarding the
          site and its content. We do not guarantee that the site will be
          uninterrupted, error-free, or free of harmful components.
        </p>
        <p>
          Information on our website is provided for general informational
          purposes and does not constitute legal, political, or professional
          advice.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, AJD and its officers,
          directors, volunteers, and affiliates will not be liable for any
          indirect, incidental, special, consequential, or punitive damages
          arising out of or related to your use of the website or our
          communications, even if we have been advised of the possibility of
          such damages.
        </p>
      </LegalSection>

      <LegalSection title="Indemnification">
        <p>
          You agree to indemnify and hold harmless AJD and its affiliates from
          any claims, damages, losses, or expenses arising from your misuse of
          the website or violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing Law">
        <p>
          These Terms are governed by the laws of the United States and the
          District of Columbia, without regard to conflict-of-law principles.
          Any dispute arising under these Terms shall be brought in the courts
          located in the District of Columbia, unless applicable law requires
          otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. We will post the revised
          Terms on this page and update the &quot;Last updated&quot; date above.
          Your continued use of the website after changes become effective
          constitutes acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>
          If you have questions about these Terms, please contact us through our{" "}
          <Link href="/join-us" className="text-primary hover:underline">
            Join Us
          </Link>{" "}
          page or other contact methods we make available on our website.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
