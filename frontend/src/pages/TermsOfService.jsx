import { usePageTitle } from "../hooks/usePageTitle";
import Layout from "../components/Layout";
import { FileText, Shield, AlertTriangle, Scale } from "lucide-react";

export default function TermsOfService() {
  usePageTitle("Terms of Service");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">Terms of Service</h1>
          <p className="text-slate-400">Last updated: December 2024</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-400 leading-relaxed">
              By accessing and using Layer7Top ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, you must not use our services. These terms apply to all users, 
              including registered members and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              2. Service Description
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Layer7Top provides Layer 7 (Application Layer) stress testing services for security professionals, 
              penetration testers, and authorized network administrators. Our services are designed to:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Test the resilience of web applications under load</li>
              <li>Identify potential vulnerabilities in network infrastructure</li>
              <li>Evaluate DDoS mitigation effectiveness</li>
              <li>Support security research and authorized penetration testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              3. Authorized Use Only
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-400 font-medium">
                IMPORTANT: You may ONLY use our services to test systems that you own or have explicit written 
                authorization to test.
              </p>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Unauthorized stress testing of third-party systems is illegal in most jurisdictions and violates 
              our terms. We reserve the right to immediately terminate accounts that violate this policy and 
              cooperate with law enforcement when required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">4. User Responsibilities</h2>
            <p className="text-slate-400 leading-relaxed mb-4">As a user of Layer7Top, you agree to:</p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Provide accurate registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not share your account with unauthorized parties</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Obtain proper authorization before testing any target</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">5. Payment Terms</h2>
            <p className="text-slate-400 leading-relaxed">
              Paid subscriptions are billed according to the plan selected. All payments are processed through 
              secure cryptocurrency payment processors. Refunds are handled on a case-by-case basis and are 
              generally not provided for services already rendered. Plan features and pricing are subject to 
              change with notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">6. Service Availability</h2>
            <p className="text-slate-400 leading-relaxed">
              We strive to maintain high service availability but do not guarantee uninterrupted access. 
              The service may be temporarily unavailable for maintenance, updates, or circumstances beyond 
              our control. We are not liable for any damages resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-400 leading-relaxed">
              Layer7Top and its operators are not liable for any direct, indirect, incidental, or consequential 
              damages arising from your use of the service. Users assume full responsibility for their actions 
              and the consequences of stress testing activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">8. Termination</h2>
            <p className="text-slate-400 leading-relaxed">
              We reserve the right to terminate or suspend your account at any time for violation of these terms, 
              illegal activity, or at our discretion. Upon termination, your right to use the service ceases 
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">9. Contact</h2>
            <p className="text-slate-400 leading-relaxed">
              For questions regarding these Terms of Service, please contact us through our Telegram support 
              channel at <a href="https://t.me/layer7top" className="text-blue-500 hover:underline">@layer7top</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
