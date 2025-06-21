import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
          <p className="text-center text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CoinPlay is committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our virtual gaming platform.
            </p>
            
            <h3 className="text-xl font-medium mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-3">
              <li>Username and email address</li>
              <li>Profile information you choose to provide</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">Gaming Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-3">
              <li>Virtual currency balances and transaction history</li>
              <li>Game statistics and performance data</li>
              <li>Achievement and progress tracking</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">Technical Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and interaction data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Virtual Currency Data</h2>
            <div className="border rounded-lg p-4 mb-4 bg-card/50">
              <p className="font-semibold">Data Protection Notice:</p>
              <p className=" mt-2">
                All virtual currency data stored on CoinPlay has no real monetary value. This includes virtual coin balances, 
                transaction records, and gaming history, which are used solely for entertainment and platform functionality.
              </p>
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Virtual currency transactions are logged for game integrity</li>
              <li>No real financial or payment information is collected</li>
              <li>Virtual balances are tied to your account for continuity</li>
              <li>Gaming statistics help improve platform experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide and maintain the CoinPlay gaming platform</li>
              <li>Track virtual currency and gaming progress</li>
              <li>Personalize your gaming experience</li>
              <li>Communicate important platform updates</li>
              <li>Ensure fair play and platform security</li>
              <li>Analyze usage patterns to improve our services</li>
              <li>Provide customer support when needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell, trade, or otherwise transfer your personal information to third parties, except:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>When required by law or legal process</li>
              <li>To protect our rights, property, or safety</li>
              <li>With your explicit consent</li>
              <li>To trusted service providers who assist in platform operations (under confidentiality agreements)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Your virtual currency data and gaming statistics remain private and are not shared with other users unless you choose to make them public through leaderboards or social features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Monitoring for unauthorized access attempts</li>
              <li>Secure server infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CoinPlay uses cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Remember your login status and preferences</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized gaming experiences</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can control cookie settings through your browser, but this may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access your personal information and gaming data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your virtual gaming statistics</li>
              <li>Opt out of non-essential communications</li>
              <li>Restrict certain data processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. 
              Virtual currency data and gaming statistics are retained to maintain platform integrity and your gaming history. 
              You may request account deletion at any time, after which we will remove your personal information within a reasonable timeframe, 
              except where required by law or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              While CoinPlay uses only virtual currency, we are committed to protecting children's privacy. 
              If you are under 13, please have a parent or guardian review this policy and our Terms of Service. 
              We do not knowingly collect personal information from children under 13 without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. International Users</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you access CoinPlay from outside your country of residence, please be aware that your information 
              may be transferred to, stored, and processed in different jurisdictions. We take appropriate measures 
              to ensure your data receives adequate protection regardless of where it is processed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date. We encourage you to review this 
              policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, your data, or your rights, please contact us 
              through the platform's support channels. We are committed to addressing your privacy concerns promptly and transparently.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              By using CoinPlay, you acknowledge that you have read and understood this Privacy Policy 
              and consent to the collection and use of your information as described herein.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 