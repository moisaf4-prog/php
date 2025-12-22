import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../App";
import { motion } from "framer-motion";
import { 
  Zap, Target, History, CreditCard, User, Shield, LogOut, Menu, X, Moon, Sun, Server, Users, Newspaper, ExternalLink
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard", label: "Attack Panel", icon: Target },
  { path: "/logs", label: "Attack Logs", icon: History },
  { path: "/plans", label: "Plans", icon: CreditCard },
  { path: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { path: "/admin", label: "Dashboard", icon: Shield },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/servers", label: "Servers", icon: Server },
  { path: "/admin/plans", label: "Plans", icon: CreditCard },
  { path: "/admin/news", label: "News", icon: Newspaper },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-slate-800 bg-slate-900/50">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-100">Layer7<span className="text-blue-500">Top</span></span>
              <p className="text-[10px] text-slate-500 -mt-1">layer7top.st</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${ 
                  isActive
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          {user?.role === "admin" && (
            <>
              <div className="pt-4 pb-2 px-3">
                <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Admin</span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "text-slate-400 hover:text-amber-500 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        
        {/* Support Link */}
        <div className="p-3 border-t border-slate-800">
          <a 
            href="https://t.me/layer7top" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
          >
            <SiTelegram className="w-5 h-5" />
            Support
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-100 truncate">{user?.username}</p>
              <p className="text-xs text-blue-500 uppercase">{user?.plan}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-blue-500 hover:bg-slate-800 rounded-xl"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex-1 justify-start gap-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-100">Layer7Top</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 rounded-lg">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-100 rounded-lg">
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-900 border-b border-slate-800"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-blue-500 rounded-lg"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-amber-500 rounded-lg"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <a 
              href="https://t.me/layer7top" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-blue-500 rounded-lg"
            >
              <SiTelegram className="w-5 h-5" />
              Support
            </a>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-500 w-full rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </motion.nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-20 lg:pt-0 min-h-screen flex flex-col">
        {/* Page Header Space */}
        <div className="h-6 lg:h-8 bg-slate-950" />
        
        {/* Content */}
        <div className="flex-1 px-4 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
        
        {/* Mini Footer */}
        <div className="mt-auto py-4 px-6 border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
            <span>© 2024 Layer7Top</span>
            <div className="flex items-center gap-4">
              <Link to="/faq" className="hover:text-slate-400">FAQ</Link>
              <a href="https://t.me/layer7top" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 flex items-center gap-1">
                <SiTelegram className="w-3 h-3" /> Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
