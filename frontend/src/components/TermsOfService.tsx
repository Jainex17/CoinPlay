import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
          <p className="text-center text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using CoinPlay, you accept and agree to be bound by the terms and provision of this agreement. 
              CoinPlay is a virtual gaming platform that uses simulated currency for entertainment purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Virtual Currency Disclaimer</h2>
            <div className="border rounded-lg p-4 mb-4 bg-card/50">
              <p className="font-semibold">IMPORTANT NOTICE:</p>
              <p className=" mt-2">
                CoinPlay operates exclusively with virtual currency. No real money is involved in any transactions, 
                games, or activities on this platform. All coins, credits, and rewards are purely digital and have no monetary value.
              </p>
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Virtual coins cannot be exchanged for real money</li>
              <li>All games use simulated betting with virtual currency only</li>
              <li>No real financial transactions occur on this platform</li>
              <li>Virtual currency has no cash value and cannot be redeemed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Permitted Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CoinPlay is intended for entertainment purposes only. You may use this service to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Play virtual games using simulated currency</li>
              <li>Track your virtual gaming statistics</li>
              <li>Compete with other users in virtual gaming activities</li>
              <li>Access educational content about probability and gaming</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Attempt to exploit or manipulate the virtual gaming system</li>
              <li>Use the platform for any illegal activities</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Use automated tools or bots to play games</li>
              <li>Misrepresent the nature of virtual currency as real money</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Account Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all 
              activities that occur under your account. You agree to notify us immediately of any unauthorized 
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of CoinPlay are owned by us and are protected by copyright, 
              trademark, and other intellectual property laws. You may not reproduce, distribute, or create 
              derivative works without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Since CoinPlay involves only virtual currency with no real monetary value, we are not liable for 
              any virtual losses, gains, or outcomes within the platform. The service is provided "as is" for 
              entertainment purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Age Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed">
              While CoinPlay uses only virtual currency, we recommend users be at least 13 years old to use this 
              platform, or have parental permission if younger. Users should understand the educational nature 
              of the gaming mechanics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
              posting. Your continued use of CoinPlay after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time for violation of these terms. You may also 
              terminate your account at any time by discontinuing use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the platform's 
              support channels.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              By using CoinPlay, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 