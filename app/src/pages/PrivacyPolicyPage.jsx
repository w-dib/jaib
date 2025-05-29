import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground text-left">
            <p className="text-sm text-muted-foreground/80 mb-4">
              Effective Date: 29th May 2025
            </p>
            <p className="text-sm text-muted-foreground/80 mb-6">
              Owner: Walid Dib
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              1. What We Collect
            </h2>
            <p>When you use Jaib, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your email and login credentials (via Supabase)</li>
              <li>Saved article URLs, metadata, annotations, and tags</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              2. How We Use It
            </h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide core functionality (saving, annotating, syncing)</li>
              <li>Authenticate you securely via Supabase</li>
              <li>Improve your experience using the app</li>
            </ul>
            <p className="mt-2">
              We do not sell or share your data with third parties.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              3. Where It's Stored
            </h2>
            <p>
              All data is stored securely in Supabase, a trusted backend
              provider. Only you can access your saved content.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              4. Cookies & Tracking
            </h2>
            <p>
              We don't use any tracking cookies or analytics tools that monitor
              your activity across the web.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              5. Data Deletion
            </h2>
            <p>
              Want your data removed? Just email{" "}
              <a
                href="mailto:wdanieldib@gmail.com"
                className="text-orange-500 hover:underline"
              >
                wdanieldib@gmail.com
              </a>{" "}
              and we'll delete your account and associated data within 7 days.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              6. Changes
            </h2>
            <p>
              This policy may be updated from time to time. Material changes
              will be communicated clearly.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">
              7. Contact
            </h2>
            <p>
              Questions or requests? Contact{" "}
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
