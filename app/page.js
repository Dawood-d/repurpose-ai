"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    if (!input) return;

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          content: input,
        }),
      });

      const data = await res.json();

      setOutput(data);

    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  return (
    <main className="max-w-5xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-6">
        AI Content Repurposer 🚀
      </h1>

      <textarea
        rows={10}
        className="w-full border p-4 rounded-lg"
        placeholder="Paste your blog content..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={generateContent}
        className="bg-black text-white px-6 py-3 rounded-lg mt-4"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {output && (

        <div className="mt-10 space-y-8">

          <section>
            <h2 className="text-2xl font-bold mb-2">
              Instagram
            </h2>

            <pre className="whitespace-pre-wrap bg-gray-100 text-black p-4 rounded-lg">
              {output.instagram}
            </pre>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-2">
              LinkedIn
            </h2>

            <pre className="whitespace-pre-wrap bg-gray-100 text-black p-4 rounded-lg">
              {output.linkedin}
            </pre>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-2">
              Twitter
            </h2>

            <pre className="whitespace-pre-wrap bg-gray-100 text-black p-4 rounded-lg">
              {output.twitter}
            </pre>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-2">
              YouTube
            </h2>

            <pre className="whitespace-pre-wrap bg-gray-100 text-black p-4 rounded-lg">
              {output.youtube}
            </pre>
          </section>

        </div>

      )}

    </main>
  );
}