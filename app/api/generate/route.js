import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase"; 

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompts = {
  instagram: (content, tone) => `You are an elite, high-level social media copywriter and brand strategist.
Analyze the following source content and transform it into comprehensive, ready-to-publish Instagram content. Avoid all robotic AI buzzwords like "delve", "unlock", or "game-changer".
Tone: ${tone} (Human, authentic, compelling, and engaging).

Provide the following in full detail:

1. TWO FULL-LENGTH CAPTIONS:
   - Caption 1 (Storytelling & Authority): Write a complete, multi-paragraph caption with a scroll-stopping hook, a narrative body, a strong Call to Action (CTA), and 5 targeted hashtags.
   - Caption 2 (Direct Value / Listicle Style): Write an alternative, high-retention breakdown caption with bullet points, actionable takeaways, a CTA, and 5 hashtags.

2. DETAILED CAROUSEL SCRIPT (6-8 Slides):
   - Provide complete text copy for every single slide. 
   - Slide 1: High-impact hook headline and subtitle.
   - Slides 2-6: Detailed content blocks with deep explanations.
   - Final Slide: Strong closing summary and CTA.

3. COMPREHENSIVE REEL / TIKTOK SCRIPT (60 seconds):
   - Visual Cues: Exact directions for what is shown on screen.
   - Spoken Audio Script: Word-for-word, conversational dialogue.
   - On-Screen Text Overlays: Exact text snippets to display.

Source content:
${content}`,

  linkedin: (content, tone) => `You are a top-tier B2B executive ghostwriter and thought leader.
Analyze the source content and write an in-depth, high-authority LinkedIn post. 
Tone: ${tone} (Sharp, professional, insightful, and conversational. No corporate fluff).

Formatting & Depth Requirements:
- Start with a contrarian, bold, or deeply analytical 1-line hook.
- Leave a blank line after the hook.
- Write a substantial body using short, punchy paragraphs.
- Include a structured section detailing 3 deep, actionable takeaways.
- End with a thought-provoking question that naturally drives high-value comments.
- Return plain text only.

Source content:
${content}`,

  twitter: (content, tone) => `You are an expert ghostwriter on X (Twitter).
Analyze the source content and craft an extensive, high-impact thread and standalone tweets.
Tone: ${tone} (Punchy, sharp, highly opinionated, zero fluff).

Include:
1. A DEEP THREAD (6-8 Tweets):
   - Tweet 1: The killer hook making a bold promise or claim.
   - Tweets 2-6: Thorough, step-by-step breakdown of the core insights.
   - Tweet 7: Summary or synthesis.
   - Tweet 8: Call to Action (like, repost, or follow).
   
2. TWO STANDALONE TWEETS:
   - High-impact, standalone thoughts under 280 characters.

Return plain text only.
Source content:
${content}`,

  youtube: (content, tone) => `You are an expert YouTube Shorts and Reels creative director.
Write a full-length, highly engaging script for a 60-second video based on the source text.
Tone: ${tone} (Fast-paced, high energy, engaging, natural dialogue).

Format as plain text with explicit, granular timestamps:
- [0:00-0:05] THE HOOK: Word-for-word spoken script + precise visual direction.
- [0:05-0:45] THE CORE VALUE: Detailed explanations, examples, or steps delivered rapidly.
- [0:45-1:00] THE PAYOFF & CTA: High-retention ending and clear call-to-action.

Source content:
${content}`,
};

export async function POST(request) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    const isUserAuthenticated = await isAuthenticated();
    
    if (!isUserAuthenticated) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser();
    const kindeId = user.id;
    const email = user.email;

    // 1. VIP Check
    const vipEmailsString = process.env.NEXT_PUBLIC_VIP_EMAILS || "";
    const vipEmails = vipEmailsString.split(",").map(e => e.trim());
    const isVip = vipEmails.includes(email);

    // Get current month string (e.g., "2026-09")
    const currentMonthString = new Date().toISOString().slice(0, 7);

    // 2. Database Check (Incognito Bypass & Monthly Limits)
    let totalCount = 0;
    let monthlyCount = 0;
    let dbMonth = "";

    const { data: userRecord } = await supabase
      .from('user_usage')
      .select('*')
      .eq('kinde_id', kindeId)
      .single();

    if (userRecord) {
      totalCount = userRecord.generation_count || 0;
      dbMonth = userRecord.current_month || "";
      monthlyCount = userRecord.monthly_count || 0;
    }

    // Reset monthly count to 0 if the month has rolled over
    if (dbMonth !== currentMonthString) {
      monthlyCount = 0;
    }

    // Enforce Free Tier Limit
    if (!isVip && totalCount >= 5) {
      return Response.json({ error: "Free limit reached" }, { status: 402 });
    }

    // Enforce VIP Monthly Limit
    if (isVip && monthlyCount >= 200) {
      return Response.json({ error: "Monthly VIP limit reached (200 generations). Resets on the 1st." }, { status: 429 });
    }

    const { platform, content, tone } = await request.json();

    // 3. Process Content (Jina Scrape & Truncation)
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

    if (textToProcess.length > 10000) {
      textToProcess = textToProcess.substring(0, 10000) + "\n\n... [Content truncated due to length limits]";
    }

    const prompt = prompts[platform](textToProcess, tone || "Professional");

    // 4. Generate via Groq
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", 
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    // 5. Update Database Counts After Successful Generation
    if (userRecord) {
      await supabase
        .from('user_usage')
        .update({ 
          generation_count: totalCount + 1,
          current_month: currentMonthString,
          monthly_count: monthlyCount + 1
        })
        .eq('kinde_id', kindeId);
    } else {
      await supabase
        .from('user_usage')
        .insert([{ 
          kinde_id: kindeId, 
          email: email, 
          generation_count: 1,
          current_month: currentMonthString,
          monthly_count: 1
        }]);
    }

    return Response.json({ text: response.choices[0].message.content });

  } catch (error) {
    console.error("Error generating content:", error);
    
    if (error.status === 429 || error?.error?.code === 'rate_limit_exceeded') {
      return Response.json(
        { error: "Too many people are using the app right now! Please wait 30 seconds and try again." }, 
        { status: 429 }
      );
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}