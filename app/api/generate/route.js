import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompts = {
  instagram: (content, tone) => `You are an elite social media strategist.
Analyze the following content and extract the most valuable insights.
Tone: ${tone} (Ensure the voice sounds human, relatable, and avoids cliché AI jargon like "delve", "unlock", or "in today's digital landscape").

Create high-converting Instagram content formatted in plain text.

Include:
1. TWO CAPTIONS: Start with a scroll-stopping hook. Use short paragraphs. End with a clear Call to Action (CTA). Include 3-5 relevant hashtags.
2. ONE CAROUSEL IDEA: Break down a concept into 4-5 slides. Provide the specific text for each slide (Slide 1: [Hook], Slide 2: [Value], etc.).
3. ONE REEL IDEA: Provide a 3-second visual hook, the core audio/speaking script, and a text-on-screen suggestion.

Content to repurpose:
${content}`,

  linkedin: (content, tone) => `You are a top-tier B2B content strategist.
Analyze the following content and create a highly engaging LinkedIn post.
Tone: ${tone} (Must sound like a real industry professional. No robotic language, no fluff).

Format requirements:
- Start with a strong, contrarian, or thought-provoking 1-line hook.
- Leave a blank line after the hook.
- Use short, punchy sentences (1-3 lines max per paragraph) for easy skimming.
- Include a bulleted list of 2-3 actionable takeaways.
- End with a question to drive comments.
- Return plain text only.

Content to repurpose:
${content}`,

  twitter: (content, tone) => `You are a viral ghostwriter on X (Twitter).
Analyze the following content and create high-impact tweets.
Tone: ${tone} (Punchy, concise, and highly opinionated. No hashtags. Talk like a real person).

Include:
1. ONE THREAD (4-5 tweets):
   - Tweet 1: The hook. Make a bold claim or promise immense value.
   - Tweets 2-4: The core value, broken down simply.
   - Tweet 5: The wrap-up and CTA.
2. TWO STANDALONE TWEETS: Short, punchy, under 280 characters. Focus on one single, strong idea each.

Return plain text only.
Content to repurpose:
${content}`,

  youtube: (content, tone) => `You are a viral YouTube Shorts producer.
Create a highly engaging script for a 30-60 second Short based on the content below.
Tone: ${tone} (Fast-paced, high energy, conversational).

Format as plain text with the following structure:
- [0:00-0:03] HOOK: A bold statement or question that demands attention immediately.
- [0:03-0:45] BODY: The core value delivered rapidly. Use quick transitions.
- [0:45-0:60] CTA / LOOP: A seamless ending that encourages re-watching or subscribing.

Provide both the "Spoken Script" and "Visual Cues" (what the viewer should see on screen).

Content to repurpose:
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

    // 2. Grab the user's input from the frontend
    const { platform, content, tone } = await request.json();

    // 3. THE NEW URL SCRAPER MAGIC
    let textToProcess = content;
    
    // Check if the input starts with http:// or https://
    const isUrl = /^(https?:\/\/[^\s]+)/.test(content.trim());

    if (isUrl) {
      try {
        // Fetch the clean article text using Jina Reader
        const scrapeResponse = await fetch(`https://r.jina.ai/${content.trim()}`);
        if (!scrapeResponse.ok) throw new Error("Scrape failed");
        
        // Overwrite the URL with the actual scraped article text
        textToProcess = await scrapeResponse.text();
      } catch (error) {
        return Response.json(
          { error: "Could not read that URL. Please try pasting the text directly." },
          { status: 400 }
        );
      }
    }

    // 4. Select the right prompt
    const prompt = prompts[platform](textToProcess, tone || "professional");

    // 5. Generate the AI content using Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    // 6. Return the response to the frontend
    return Response.json({ text: response.choices[0].message.content });

  } catch (error) {
    console.error("Error generating content:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}