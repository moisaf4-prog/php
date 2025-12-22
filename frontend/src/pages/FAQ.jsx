import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../App";
import { Button } from "../components/ui/button";
import { 
  Zap, ChevronDown, Moon, Sun, HelpCircle, Shield, Clock, Users, CreditCard, Server, Target, ArrowLeft
} from "lucide-react";

const faqs = [
  {
    category: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is Layer7Top?",
        a: "Layer7Top is a professional Layer 7 stress testing platform designed to help security researchers and administrators test the resilience of their web infrastructure against various HTTP-based attack vectors."
      },
      {
        q: "Is this service legal?",
        a: "Yes, when used for authorized testing only. You must have explicit permission to test any target. Testing without authorization is illegal and against our Terms of Service. We log all activity and cooperate with law enforcement."
      },
      {
        q: "What is Layer 7 testing?",
        a: "Layer 7 refers to the Application Layer in the OSI model. Layer 7 attacks target web applications using HTTP/HTTPS requests to overwhelm servers. This differs from Layer 3/4 attacks which target network infrastructure directly."
      }
    ]
  },
  {
    category: "Attack Methods",
    icon: Target,
    questions: [
      {
        q: "What attack methods are available?",
        a: "We offer various methods including HTTP GET/POST floods, Slowloris, TLS Bypass, Cloudflare Bypass, Browser Emulation, and RUDY. Each method is designed for different testing scenarios and protection bypass."
      },
      {
        q: "What is Cloudflare Bypass?",
        a: "CF Bypass is a method designed to test how your site handles requests that attempt to bypass Cloudflare's protection. It simulates sophisticated attack patterns that try to reach the origin server directly."
      },
      {
        q: "What is Slowloris?",
        a: "Slowloris is a denial-of-service attack method that uses partial HTTP requests to keep connections open, exhausting the target's connection pool. It's effective against servers with limited concurrent connection handling."
      },
      {
        q: "What is Browser Emulation?",
        a: "Browser Emulation simulates real browser behavior including JavaScript execution, cookies, and headers. It's useful for testing against bot detection systems and WAFs that check for human-like behavior."
      }
    ]
  },
  {
    category: "Plans & Pricing",
    icon: CreditCard,
    questions: [
      {
        q: "What's included in the Free plan?",
        a: "Free plan includes 60 seconds max attack duration, 1 concurrent attack, and access to 2 basic methods (HTTP-GET, HTTP-POST). It's perfect for trying out the platform."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept various cryptocurrencies including Litecoin (LTC), Monero (XMR), USDT (TRC20), Tron (TRX), and Solana (SOL). Crypto payments ensure privacy and fast processing."
      },
      {
        q: "Can I upgrade my plan mid-cycle?",
        a: "Yes, you can upgrade at any time. The remaining days from your current plan will be prorated and applied to your new plan."
      },
      {
        q: "Do plans auto-renew?",
        a: "No, all plans are one-time monthly purchases. You'll receive a notification before your plan expires to renew."
      }
    ]
  },
  {
    category: "Technical",
    icon: Server,
    questions: [
      {
        q: "How do I get my API key?",
        a: "Your API key is available in your Profile page after registration. You can regenerate it at any time if needed. The API allows you to start attacks programmatically."
      },
      {
        q: "What are concurrent attacks?",
        a: "Concurrent attacks refers to how many stress tests you can run simultaneously. Higher tier plans allow more concurrent attacks for comprehensive testing."
      },
      {
        q: "What ports can I target?",
        a: "You can target any port, but Layer 7 attacks are most effective on HTTP (80) and HTTPS (443) ports. Custom ports are supported for non-standard web server configurations."
      },
      {
        q: "How accurate is the server status?",
        a: "Server status is updated every 30 seconds. CPU and RAM metrics are polled from our attack servers to ensure accurate capacity reporting."
      }
    ]
  },
  {
    category: "Security & Privacy",
    icon: Shield,
    questions: [
      {
        q: "Do you log attacks?",
        a: "Yes, we maintain logs of all attacks for legal compliance. Logs include target, timestamp, method, and user information. These are retained for 90 days."
      },
      {
        q: "Is my account information safe?",
        a: "We use industry-standard encryption for all stored data. Passwords are hashed using SHA-256. We never store plaintext credentials."
      },
      {
        q: "Can I test any website?",
        a: "You can only test websites you own or have explicit written permission to test. Unauthorized testing is illegal and will result in immediate account termination."
      }
    ]
  },
  {
    category: "Account & Support",
    icon: Users,
    questions: [
      {
        q: "How do I contact support?",
        a: "You can reach our support team via Telegram. Response time is typically within 24 hours for general inquiries and 4 hours for urgent issues."
      },
      {
        q: "Can I change my username?",
        a: "Usernames cannot be changed after registration. If you need a different username, you'll need to create a new account."
      },
      {
        q: "What if I forgot my password?",
        a: "Contact support via Telegram with your username and Telegram ID for account recovery. We'll verify your identity before resetting."
      }
    ]
  }
];

export default function FAQ() {
  const { theme, toggleTheme } = useTheme();
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleItem = (categoryIdx, questionIdx) => {
    const key = `${categoryIdx}-${questionIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-100">Layer7<span className="text-blue-500">Top</span></span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-blue-500 rounded-lg">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link to="/">
              <Button variant="ghost" className="text-slate-400 hover:text-slate-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-400 text-lg">
            Everything you need to know about Layer7Top
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              All
            </button>
            {faqs.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeCategory === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-100'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((category, catIdx) => {
            if (activeCategory !== null && activeCategory !== catIdx) return null;
            const Icon = category.icon;
            
            return (
              <motion.div
                key={catIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.1 }}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-100">{category.category}</h2>
                </div>
                
                <div className="divide-y divide-slate-800">
                  {category.questions.map((item, qIdx) => {
                    const isOpen = openItems[`${catIdx}-${qIdx}`];
                    
                    return (
                      <div key={qIdx}>
                        <button
                          onClick={() => toggleItem(catIdx, qIdx)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                        >
                          <span className="font-medium text-slate-100 pr-4">{item.q}</span>
                          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-8 border border-blue-500/20 text-center">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Still have questions?</h3>
            <p className="text-slate-400 mb-6">Can't find what you're looking for? Reach out to our support team.</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            Layer7Top © 2024 • For authorized testing only
          </p>
        </div>
      </footer>
    </div>
  );
}