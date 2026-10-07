import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">
                    When you create an account, we collect your email address and any optional profile information you provide.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Calculation Data</h3>
                  <p className="text-sm text-muted-foreground">
                    We store the mortgage calculations and scenarios you save for your convenience. This includes home price, down payment, interest rates, and other financial inputs you enter.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <p className="text-sm text-muted-foreground">
                    We automatically collect information about how you use our service, including pages visited, features used, and time spent on the site.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>To provide and maintain our mortgage calculator service</li>
                  <li>To save your calculations and preferences across sessions</li>
                  <li>To send you important service updates and notifications</li>
                  <li>To improve our service and develop new features</li>
                  <li>To analyze usage patterns and optimize performance</li>
                  <li>To prevent fraud and ensure security</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Keep you logged in between sessions</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze site traffic and usage patterns</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  You can control cookies through your browser settings, but disabling them may affect functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Authentication & Database</h3>
                  <p className="text-sm text-muted-foreground">
                    We use secure cloud services to manage user authentication and store your saved calculations. Your data is encrypted in transit and at rest.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    We use Stripe to process subscription payments. Stripe may collect payment information in accordance with their privacy policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Data Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Export your saved calculations</li>
                  <li>Opt out of marketing communications</li>
                  <li>Object to data processing in certain circumstances</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We retain your account information and saved calculations as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where required by law.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you have questions about this Privacy Policy or how we handle your data, please contact us at{" "}
                  <a href="mailto:privacy@mortgagequotepro.com" className="text-primary hover:underline">
                    privacy@mortgagequotepro.com
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

export default PrivacyPolicy;
