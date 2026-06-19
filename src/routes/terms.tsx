import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Ukyro" },
      { name: "description", content: "Read our terms and conditions for using Ukyro carpooling service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 md:p-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

          <div className="space-y-6 text-sm md:text-base">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Ukyro, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Users must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of their account credentials</li>
                <li>Be respectful to other users, drivers, and passengers</li>
                <li>Follow all applicable traffic laws and regulations</li>
                <li>Arrive on time for scheduled rides</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Driver Requirements</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Drivers must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Have a valid driving license and vehicle registration</li>
                <li>Maintain valid insurance and pollution certificates</li>
                <li>Keep their vehicle in safe and roadworthy condition</li>
                <li>Provide accurate vehicle information</li>
                <li>Complete the profile verification process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Booking and Cancellation</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Booking rules:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Bookings are confirmed upon successful payment</li>
                <li>Cancellations must be made at least 2 hours before departure</li>
                <li>Late cancellations may incur a fee</li>
                <li>No-shows may result in account restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Payment and Refunds</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Payment policies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>All payments are processed securely through our platform</li>
                <li>Refunds are processed within 5-7 business days</li>
                <li>Refund eligibility depends on cancellation timing</li>
                <li>Platform fees are non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Safety Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                For your safety:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Verify driver details before boarding</li>
                <li>Share trip details with trusted contacts</li>
                <li>Report any suspicious activity immediately</li>
                <li>Use the in-app emergency features if needed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Users must not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the service for illegal activities</li>
                <li>Harass, abuse, or discriminate against others</li>
                <li>Provide false information or documents</li>
                <li>Attempt to circumvent payment systems</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of Ukyro is also governed by our Privacy Policy, which describes how we collect, 
                use, and protect your personal information. By using our service, you consent to our data practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ukyro is not responsible for any damages, injuries, or losses resulting from the use of our service. 
                We act as a platform connecting drivers and passengers and do not guarantee the quality or safety of rides.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the service after changes 
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms and Conditions, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: support@ukyro.com<br />
                Phone: +91 9876543210
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-border/40">
            <Link to="/dashboard">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
