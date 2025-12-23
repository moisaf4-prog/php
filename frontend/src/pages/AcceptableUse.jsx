import { usePageTitle } from "../hooks/usePageTitle";
import Layout from "../components/Layout";
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Gavel } from "lucide-react";

export default function AcceptableUse() {
  usePageTitle("Acceptable Use Policy");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">Acceptable Use Policy</h1>
          <p className="text-slate-400">Last updated: December 2024</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Critical Warning</h3>
              <p className="text-slate-300">
                Using Layer7Top to attack systems without explicit authorization is <strong>ILLEGAL</strong> and 
                may result in criminal prosecution, civil liability, and permanent account termination. 
                We actively monitor for abuse and cooperate with law enforcement.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">1. Purpose of This Policy</h2>
            <p className="text-slate-400 leading-relaxed">
              This Acceptable Use Policy ("AUP") defines the permitted and prohibited uses of Layer7Top's 
              stress testing services. Our platform is designed exclusively for legitimate security testing, 
              research, and authorized penetration testing activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              2. Permitted Uses
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">You MAY use Layer7Top to:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Test your own websites and servers
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Test client systems with written authorization
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Evaluate DDoS protection services you own
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Conduct authorized security research
                  </li>
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Load test pre-production environments
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Test firewall and WAF configurations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Educational and training purposes
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Bug bounty programs (with scope proof)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              3. Prohibited Uses
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">You MUST NOT use Layer7Top to:</p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Attack any system without explicit written authorization
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Target government, healthcare, financial, or critical infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Conduct attacks for extortion, ransom, or competitive sabotage
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Disrupt emergency services or public safety systems
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Resell or redistribute our services without permission
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Use automated tools to exploit our API beyond your plan limits
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Share your account credentials with unauthorized users
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">4. Authorization Requirements</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Before testing any target, you must have:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Written permission from the system owner (email, contract, or authorization letter)</li>
              <li>Clear scope definition of what can be tested</li>
              <li>Understanding of applicable laws in your jurisdiction</li>
              <li>Notification to relevant parties if required by your agreement</li>
            </ul>
            <p className="text-slate-400 leading-relaxed mt-4">
              We may request proof of authorization at any time. Failure to provide valid authorization 
              will result in immediate account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-500" />
              5. Enforcement & Consequences
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Violations of this AUP may result in:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li><strong className="text-amber-400">Warning:</strong> First minor violation may receive a warning</li>
              <li><strong className="text-orange-400">Suspension:</strong> Repeated or moderate violations lead to account suspension</li>
              <li><strong className="text-red-400">Termination:</strong> Serious violations result in permanent ban without refund</li>
              <li><strong className="text-red-500">Legal Action:</strong> Criminal activity will be reported to law enforcement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">6. Reporting Abuse</h2>
            <p className="text-slate-400 leading-relaxed">
              If you believe our services are being misused or if you've been targeted by an unauthorized 
              attack, please contact us immediately via Telegram at 
              <a href="https://t.me/layer7top" className="text-blue-500 hover:underline ml-1">@layer7top</a>. 
              We take abuse reports seriously and will investigate promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">7. Policy Updates</h2>
            <p className="text-slate-400 leading-relaxed">
              We may update this AUP at any time. Continued use of our services after changes constitutes 
              acceptance of the updated policy. Major changes will be announced through our platform.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
