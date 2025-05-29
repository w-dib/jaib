import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-orange-500 hover:text-orange-600 mb-6 group"
        >
          <ArrowLeft
            size={20}
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          />
          Back to Home
        </Link>
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Terms & Conditions
          </h1>
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground text-left">
            <p className="text-sm text-muted-foreground/80 mb-4">
              Effective Date: 29th May 2025
            </p>
            <p className="text-sm text-muted-foreground/80 mb-6">
              Owner: Walid Dib
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              1. Overview
            </h2>
            <p>
              Jaib is a personal web tool that lets you save and annotate
              articles from around the web. By using Jaib, you agree to these
              Terms of Service.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              2. Your Account
            </h2>
            <p>
              To use Jaib, you'll need to create an account. You're responsible
              for your activity and the security of your login. Please don't
              share your credentials.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              3. Your Content
            </h2>
            <p>
              You retain full ownership of anything you save or write in Jaib —
              including annotations, tags, and saved URLs. We do not make any of
              your content public.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              4. Acceptable Use
            </h2>
            <p>
              Don't use Jaib to break the law, abuse our service, or interfere
              with other users. That's grounds for account termination.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              5. Intellectual Property
            </h2>
            <p>
              Jaib and its logo, interface, and code are owned by Walid Dib. You
              agree not to copy, reverse engineer, or resell any part of it.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              6. Disclaimer
            </h2>
            <p>
              Jaib is provided "as is." We don't guarantee that the service will
              always work perfectly, or that your data will never be lost —
              though we take every precaution to avoid that.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              7. Limitation of Liability
            </h2>
            <p>
              We are not liable for any damages resulting from your use of Jaib.
              Back up your content regularly, just in case.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              8. Changes
            </h2>
            <p>
              These terms might be updated from time to time. We'll do our best
              to notify users in advance.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              9. Contact
            </h2>
            <p>
              For any questions, contact{" "}
              <a
                href="mailto:wdanieldib@gmail.com"
                className="text-orange-500 hover:underline"
              >
                wdanieldib@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
