import { usePageTitle } from "../hooks/usePageTitle";
import Layout from "../components/Layout";
import { Lock, Eye, Database, Trash2, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: December 2024</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              1. Information We Collect
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Layer7Top collects minimal information necessary to provide our services:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li><strong className="text-slate-300">Account Information:</strong> Username, hashed password, and optional Telegram ID for support</li>
              <li><strong className="text-slate-300">Usage Data:</strong> Attack logs including targets, methods, and timestamps (for your records)</li>
              <li><strong className="text-slate-300">Payment Information:</strong> Cryptocurrency transaction IDs (we do not store payment details)</li>
              <li><strong className="text-slate-300">Technical Data:</strong> IP addresses and browser information for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-500" />
              2. How We Use Your Information
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">Your information is used to:</p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Provide and maintain our stress testing services</li>
              <li>Process your subscription and payments</li>
              <li>Send important service notifications</li>
              <li>Prevent abuse and unauthorized access</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations when required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              3. Data Security
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Passwords are hashed using secure algorithms (SHA-256)</li>
              <li>All connections are encrypted via HTTPS/TLS</li>
              <li>Access to user data is restricted to essential personnel</li>
              <li>Regular security audits and updates</li>
              <li>Servers are protected with enterprise-grade security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">4. Data Sharing</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share data only in these circumstances:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>When required by law or legal process</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist our operations (under strict confidentiality)</li>
              <li>In the event of a business transfer or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              5. Data Retention & Deletion
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Account data is retained while your account is active</li>
              <li>Attack logs are retained for 30 days by default</li>
              <li>You may request deletion of your account and data at any time</li>
              <li>Some data may be retained for legal compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">6. Cookies & Tracking</h2>
            <p className="text-slate-400 leading-relaxed">
              We use essential cookies for authentication and session management. We do not use third-party 
              tracking cookies or analytics services that collect personal data. Your browser settings can 
              control cookie behavior.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">7. Your Rights</h2>
            <p className="text-slate-400 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">8. Contact Us</h2>
            <p className="text-slate-400 leading-relaxed">
              For privacy-related inquiries or to exercise your rights, contact us via Telegram at 
              <a href="https://t.me/layer7top" className="text-blue-500 hover:underline ml-1">@layer7top</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
