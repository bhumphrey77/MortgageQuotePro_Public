import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Disclaimer</AlertTitle>
            <AlertDescription>
              This calculator provides estimates only and is not a substitute for professional financial advice. 
              All calculations are for informational purposes and should not be considered as official loan quotes or commitments.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  By accessing and using Mortgage Quote Pro ("the Service"), you accept and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Mortgage Quote Pro is an online mortgage calculator that provides:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Mortgage payment calculations based on user inputs</li>
                  <li>Debt-to-Income (DTI) ratio analysis</li>
                  <li>Scenario comparison tools</li>
                  <li>Amortization schedules</li>
                  <li>PDF export of calculations</li>
                  <li>Saved quote management for registered users</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Disclaimer of Warranties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-destructive">IMPORTANT: Not Financial Advice</h3>
                  <p className="text-sm text-muted-foreground">
                    The calculations provided by this Service are <strong>estimates only</strong> and should not be relied upon as:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Official loan quotes or commitments</li>
                    <li>Professional financial or mortgage advice</li>
                    <li>Legal or tax advice</li>
                    <li>Guarantees of loan approval or terms</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  Actual loan terms, rates, payments, and fees may vary based on many factors including but not limited to: 
                  credit score, loan-to-value ratio, property type, occupancy, lender requirements, and market conditions.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Always consult with a qualified mortgage professional or financial advisor</strong> before making any financial decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Account Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    To save calculations and access certain features, you must create an account. You agree to provide accurate information and keep your account credentials secure.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Responsibility</h3>
                  <p className="text-sm text-muted-foreground">
                    You are responsible for all activities under your account. Notify us immediately of any unauthorized use.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use automated scripts or bots without permission</li>
                  <li>Reproduce, duplicate, or copy the Service without authorization</li>
                  <li>Misrepresent your identity or affiliation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, 
                  are owned by Mortgage Quote Pro and are protected by copyright, trademark, and other intellectual property laws.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, MORTGAGE QUOTE PRO SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Any financial losses resulting from use of our calculations</li>
                  <li>Decisions made based on information provided by the Service</li>
                  <li>Errors or inaccuracies in calculations</li>
                  <li>Service interruptions or downtime</li>
                  <li>Loss of data or saved calculations</li>
                  <li>Third-party actions or content (including advertisements)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  The Service is provided "AS IS" without warranties of any kind, either express or implied.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Indemnification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You agree to indemnify and hold harmless Mortgage Quote Pro from any claims, damages, or expenses arising from 
                  your use of the Service or violation of these Terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Payment Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      Subscription payments are processed by Stripe. We do not store your full payment card details on our servers.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">External Links</h3>
                    <p className="text-sm text-muted-foreground">
                      Our Service may contain links to third-party websites. We are not responsible for the content or practices of these sites.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Termination</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, 
                  without notice, for conduct that we believe violates these Terms or is harmful to other users or our business.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. 
                  We will update the "Last Updated" date at the top of this page.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Governing Law</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  These Terms are governed by and construed in accordance with the laws of the United States, 
                  without regard to conflict of law principles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>13. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  For questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@mortgagequotepro.com" className="text-primary hover:underline">
                    legal@mortgagequotepro.com
                  </a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
