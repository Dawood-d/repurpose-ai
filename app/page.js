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

  // --- KINDE USER HOOK ---
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  // --- FREEMIUM HOOK STATE ---
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

  useEffect(() => {
    const usage = localStorage.getItem("repurpose_usage");
    if (usage) setGenerationsUsed(parseInt(usage));
  }, []);

  const generateContent = async () => {
    if (!input.trim()) return;

    if (generationsUsed >= MAX_FREE_TRIPS) {
      setShowUpgradeModal(true);
      return;
    }

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

      setOutputs((prev) => ({ ...prev, [activeTab]: data.content }));

      const newUsage = generationsUsed + 1;
      setGenerationsUsed(newUsage);
      localStorage.setItem("repurpose_usage", newUsage);

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(outputs[activeTab]);
    alert("Copied");
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER WITH KINDE AUTH */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold">AI Repurpose Studio 🚀</h1>
            <p className="text-gray-400 mt-2">
              Repurpose blogs into platform-ready social content
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center justify-center gap-4">
            {!isLoading && !isAuthenticated ? (
              <>
                <LoginLink className="text-white font-semibold hover:text-gray-300">Log In</LoginLink>
                <RegisterLink className="bg-white text-black px-4 py-1 rounded-lg font-bold">Sign Up</RegisterLink>
              </>
            ) : (
              <LogoutLink className="text-gray-400 hover:text-white">Log Out</LogoutLink>
            )}
          </div>
        </div>

        {/* MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-6">Content Input</h2>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl mb-4 text-white"
            >
              <option>Professional</option>
              <option>Viral</option>
              <option>Storytelling</option>
              <option>Educational</option>
            </select>

            <textarea
              rows={18}
              placeholder="Paste blog/article content here..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOutputs({ instagram: "", linkedin: "", twitter: "", youtube: "" });
              }}
              className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl resize-none text-white placeholder-gray-400"
            />

            <button
              onClick={generateContent}
              disabled={loading}
              className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-semibold hover:opacity-90 capitalize"
            >
              {loading ? `Generating ${activeTab}...` : `Generate ${activeTab}`}
            </button>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Output Workspace</h2>
              {outputs[activeTab] && (
                <button
                  onClick={copyText}
                  className="bg-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-600"
                >
                  Copy
                </button>
              )}
            </div>

            <div className="flex gap-3 flex-wrap mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl capitalize ${
                    activeTab === tab ? "bg-white text-black" : "bg-zinc-800 text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-zinc-800 rounded-2xl p-5 min-h-[550px] overflow-y-auto">
              {loading && <div className="text-gray-400">Generating {activeTab} content...</div>}
              {!loading && !outputs[activeTab] && (
                <div className="text-gray-500">Select a platform and click Generate</div>
              )}
              {error && <div className="text-red-400">{error}</div>}
              {outputs[activeTab] && (
                <pre className="whitespace-pre-wrap text-sm leading-7">
                  {outputs[activeTab]}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-3 text-white">Out of Free Credits! 🚀</h2>
            <p className="text-gray-400 mb-8">
              You've used your 5 free AI generations. Upgrade to Lifetime Access to unlock unlimited content repurposing forever.
            </p>
            <button 
              className="bg-white text-black px-6 py-4 rounded-xl font-bold w-full hover:bg-gray-200 transition-colors"
              onClick={() => window.open('https://payhip.com/b/TrkSR', '_blank')} 
            >
              Upgrade Now - $49
            </button>
            <button 
              className="mt-6 text-sm text-gray-500 hover:text-white transition-colors"
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