import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompts = {
  instagram: (content, tone) => `You are an elite, high-level social media copywriter and brand strategist.
Analyze the following source content and transform it into comprehensive, ready-to-publish Instagram content. Avoid all robotic AI buzzwords like "delve", "unlock", or "game-changer".
Tone: ${tone} (Human, authentic, compelling, and engaging).

Provide the following in full detail (do not abbreviate or summarize):

1. TWO FULL-LENGTH CAPTIONS:
   - Caption 1 (Storytelling & Authority): Write a complete, multi-paragraph caption with a scroll-stopping hook, a narrative body that expands on the core ideas, a strong Call to Action (CTA), and 5 targeted hashtags.
   - Caption 2 (Direct Value / Listicle Style): Write an alternative, high-retention breakdown caption with bullet points, actionable takeaways, a CTA, and 5 targeted hashtags.

2. DETAILED CAROUSEL SCRIPT (6-8 Slides):
   - Provide complete text copy for every single slide. 
   - Slide 1: High-impact hook headline and subtitle.
   - Slides 2-6: Detailed content blocks with deep explanations, data points, or step-by-step breakdowns.
   - Final Slide: Strong closing summary and CTA.

3. COMPREHENSIVE REEL / TIKTOK SCRIPT (60 seconds):
   - Visual Cues: Exact directions for what is shown on screen.
   - Spoken Audio Script: Word-for-word, conversational dialogue designed for high retention.
   - On-Screen Text Overlays: Exact text snippets to display.

Source content to repurpose:
${content}`,

  linkedin: (content, tone) => `You are a top-tier B2B executive ghostwriter and thought leader.
Analyze the source content and write an in-depth, high-authority LinkedIn post. 
Tone: ${tone} (Sharp, professional, insightful, and conversational. No corporate fluff).

Formatting & Depth Requirements:
- Start with a contrarian, bold, or deeply analytical 1-line hook.
- Leave a blank line after the hook.
- Write a substantial body (150-250 words total) using short, punchy paragraphs (1-3 sentences max) to ensure maximum readability and dwell time.
- Include a structured section detailing 3 deep, actionable takeaways or professional insights.
- End with a thought-provoking question that naturally drives high-value comments and discussion.
- Return plain text only.

Source content to repurpose:
${content}`,

  twitter: (content, tone) => `You are an expert ghostwriter on X (Twitter).
Analyze the source content and craft an extensive, high-impact thread and standalone tweets.
Tone: ${tone} (Punchy, sharp, highly opinionated, zero fluff).

Include:
1. A DEEP THREAD (6-8 Tweets):
   - Tweet 1: The killer hook making a bold promise or claim.
   - Tweets 2-6: Thorough, step-by-step breakdown of the core insights, concepts, or value.
   - Tweet 7: Summary or synthesis.
   - Tweet 8: Call to Action (like, repost, or follow).
   
2. TWO STANDALONE TWEETS:
   - High-impact, standalone thoughts under 280 characters that can be posted independently.

Return plain text only.
Source content to repurpose:
${content}`,

  youtube: (content, tone) => `You are an expert YouTube Shorts and Reels creative director.
Write a full-length, highly engaging script for a 60-second video based on the source text.
Tone: ${tone} (Fast-paced, high energy, engaging, natural dialogue).

Format as plain text with explicit, granular timestamps:
- [0:00-0:05] THE HOOK: Word-for-word spoken script + precise visual direction to capture attention instantly.
- [0:05-0:45] THE CORE VALUE: Detailed explanations, examples, or steps delivered rapidly with visual transition notes.
- [0:45-1:00] THE PAYOFF & CTA: High-retention ending, strong loop potential, and clear call-to-action to subscribe or engage.

Source content to repurpose:
${content}`,
};

export async function POST(request) {
  try {
    // 1. Kinde Authentication Check
    const { isAuthenticated } = getKindeServerSession();
    const isUserAuthenticated = await isAuthenticated();
    
    if (!isUserAuthenticated) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Grab frontend input
    const { platform, content, tone } = await request.json();

    // 3. URL Scraper logic
    let textToProcess = content;
    const isUrl = /^(https?:\/\/[^\s]+)/.test(content.trim());

    if (isUrl) {
      try {
        const scrapeResponse = await fetch(`https://r.jina.ai/${content.trim()}`);
        if (!scrapeResponse.ok) throw new Error("Scrape failed");
        textToProcess = await scrapeResponse.text();
      } catch (error) {
        return Response.json(
          { error: "Could not read that URL. Please try pasting the text directly." },
          { status: 400 }
        );
      }
    }

    // 4. Token limit safety valve (Reduced to 10,000 chars to leave room for long outputs)
    if (textToProcess.length > 10000) {
      textToProcess = textToProcess.substring(0, 10000) + "\n\n... [Content truncated due to length limits]";
    }

    // 5. Select prompt
    const prompt = prompts[platform](textToProcess, tone || "Professional");

    // 6. Generate via Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    return Response.json({ text: response.choices[0].message.content });

  } catch (error) {
    console.error("Error generating content:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}