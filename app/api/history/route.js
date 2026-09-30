"use client";

import { useState, useEffect } from "react";
import { RegisterLink, LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function Home() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("Professional");
  const [activeTab, setActiveTab] = useState("instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [cooldown, setCooldown] = useState(0);

  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();

  const vipEmailsString = process.env.NEXT_PUBLIC_VIP_EMAILS || "";
  const vipEmails = vipEmailsString.split(",").map(email => email.trim());
  const isVip = user?.email && vipEmails.includes(user.email);

  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const MAX_FREE_TRIPS = 5;

  const [outputs, setOutputs] = useState({
    instagram: "",
    linkedin: "",
    twitter: "",
    youtube: "",
  });

  const tabs = ["instagram", "linkedin", "twitter", "youtube"];

  // --- HISTORY STATE ---
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const cooldownEnd = localStorage.getItem("repurpose_cooldown_end");
    if (cooldownEnd) {
      const remainingTime = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCooldown(remainingTime);
      } else {
        localStorage.removeItem("repurpose_cooldown_end");
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const generateContent = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, tone, platform: activeTab }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
           setShowUpgradeModal(true);
           setLoading(false);
           return;
        }
        throw new Error(data.error || "Generation failed");
      }

      setOutputs((prev) => ({ ...prev, [activeTab]: data.text }));

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
    setCooldown(30); 
    localStorage.setItem("repurpose_cooldown_end", (Date.now() + 30000).toString());
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  // --- FETCH HISTORY ---
  const loadHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.history) {
        setHistoryData(data.history);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
    setLoadingHistory(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 font-semibold tracking-widest uppercase text-sm">
          Loading Studio...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold tracking-tight">AI Repurpose Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <LoginLink className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Log In</LoginLink>
            <RegisterLink className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Get Started Free
            </RegisterLink>
          </div>
        </nav>

        <section className="max-w-5xl mx-auto px-6 py-32 text-center flex flex-col items-center">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-4 py-1.5 rounded-full uppercase tracking-widest font-semibold mb-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Built for Modern Creators
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Turn One Blog Into <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Weeks of Social Content.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed">
            Instantly transform any article, URL, or notes into high-converting Instagram carousels, LinkedIn thought-leadership posts, Twitter threads, and YouTube scripts.
          </p>
          <RegisterLink className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Start Repurposing For Free →
          </RegisterLink>
          <p className="text-sm text-zinc-500 mt-6 font-medium">No credit card required. 5 free generations.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
              <p className="text-zinc-500 text-sm mt-1">Repurpose your content</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            {isVip && (
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                VIP Access
              </span>
            )}
            
            <button 
              onClick={loadHistory}
              className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
            >
              🕒 History
            </button>

            <div className="w-px h-4 bg-zinc-700 hidden sm:block"></div>
            <LogoutLink className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Log Out
            </LogoutLink>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col">
            <h2 className="text-xl font-bold mb-6">Source Content</h2>
            
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 p-3 rounded-xl mb-4 text-white font-medium focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
            >
              <option>Professional</option>
              <option>Viral</option>
              <option>Storytelling</option>
              <option>Educational</option>
            </select>

            <textarea
              rows={16}
              placeholder="Paste blog/article content here or a URL..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOutputs({ instagram: "", linkedin: "", twitter: "", youtube: "" });
              }}
              className="w-full flex-grow bg-zinc-800/50 border border-zinc-700 p-5 rounded-2xl resize-none text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-sans leading-relaxed"
            />

            <button
              onClick={generateContent}
              disabled={loading || cooldown > 0}
              className="w-full mt-4 bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading 
                ? `Generating ${activeTab}...` 
                : cooldown > 0 
                  ? `Wait ${cooldown}s to generate again` 
                  : `Generate ${activeTab}`}
            </button>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Output</h2>
              {outputs[activeTab] && (
                <button
                  onClick={() => copyText(outputs[activeTab])}
                  className="bg-zinc-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Copy Text
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                    activeTab === tab 
                      ? "bg-white text-black shadow-md" 
                      : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-zinc-800/30 border border-zinc-800 rounded-2xl p-6 flex-grow overflow-y-auto max-h-[500px]">
              {loading && (
                <div className="h-full flex items-center justify-center text-zinc-500 font-medium animate-pulse">
                  Crafting your {activeTab} content...
                </div>
              )}
              {!loading && !outputs[activeTab] && !error && (
                <div className="h-full flex items-center justify-center text-zinc-600 font-medium">
                  Select a platform and click Generate
                </div>
              )}
              {error && (
                <div className="text-red-400 text-sm font-medium p-4 bg-red-900/10 rounded-xl border border-red-900/30">
                  {error}
                </div>
              )}
              {outputs[activeTab] && (
                <pre className="whitespace-pre-wrap text-[15px] leading-relaxed font-sans text-zinc-300">
                  {outputs[activeTab]}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold">Your History</h2>
                <p className="text-sm text-zinc-500">Your recent AI generations</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-zinc-400 hover:text-white bg-zinc-800 px-3 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              {loadingHistory ? (
                <div className="text-center text-zinc-500 animate-pulse mt-10">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center text-zinc-500 mt-10">No history found yet. Go generate something!</div>
              ) : (
                historyData.map((item) => (
                  <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2 items-center">
                        <span className="bg-white text-black px-2 py-1 rounded text-xs font-bold uppercase">
                          {item.platform}
                        </span>
                        <span className="text-xs text-zinc-400">{item.tone}</span>
                      </div>
                      <button 
                        onClick={() => copyText(item.generated_content)}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-md transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-sans text-zinc-300 bg-black/40 p-4 rounded-xl max-h-64 overflow-y-auto">
                      {item.generated_content}
                    </pre>
                    <div className="text-right text-[10px] text-zinc-500 mt-3">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl text-center max-w-md w-full mx-4 shadow-2xl">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-3 text-white">Out of Free Credits!</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              You've used your 5 free AI generations. Upgrade to Lifetime Access to unlock unlimited content repurposing forever.
            </p>
            <button 
              className="bg-white text-black px-6 py-4 rounded-xl font-bold w-full hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              onClick={() => window.open('https://payhip.com/b/TrkSR', '_blank')} 
            >
              Upgrade Now - $49
            </button>
            <button 
              className="mt-6 text-sm font-semibold text-zinc-500 hover:text-white transition-colors"
              onClick={() => setShowUpgradeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}