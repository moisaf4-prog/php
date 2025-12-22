import { Link } from "react-router-dom";
import { Zap, ExternalLink } from "lucide-react";
import { SiTelegram, SiLitecoin, SiMonero, SiTether, SiSolana } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-100">
                Layer7<span className="text-blue-500">Top</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm mb-4">
              Professional Layer 7 stress testing platform for security researchers.
            </p>
            <div className="flex items-center gap-3 text-slate-500">
              <SiLitecoin className="w-4 h-4 hover:text-blue-500 cursor-pointer transition-colors" />
              <SiMonero className="w-4 h-4 hover:text-orange-500 cursor-pointer transition-colors" />
              <SiTether className="w-4 h-4 hover:text-green-500 cursor-pointer transition-colors" />
              <SiSolana className="w-4 h-4 hover:text-purple-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/plans" className="text-slate-400 hover:text-blue-500 text-sm transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-blue-500 text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/register" className="text-slate-400 hover:text-blue-500 text-sm transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-slate-400 text-sm">Terms of Service</span></li>
              <li><span className="text-slate-400 text-sm">Privacy Policy</span></li>
              <li><span className="text-slate-400 text-sm">Acceptable Use</span></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Support</h4>
            <a 
              href="https://t.me/layer7top" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-500 text-sm font-medium transition-colors"
            >
              <SiTelegram className="w-4 h-4" />
              @layer7top
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-slate-500 text-xs mt-3">
              24/7 Support • Fast Response
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2024 Layer7Top. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            layer7top.st • For authorized testing only
          </p>
        </div>
      </div>
    </footer>
  );
}
