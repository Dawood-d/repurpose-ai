import Groq from "groq-sdk";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompts = {
  instagram: (content, tone) => `
You are a social media strategist.

Tone: ${tone}

Create Instagram content from this blog.

Return plain text only.

Include:
- 2 engaging captions
- 1 carousel idea
- 1 reel idea

Content:
${content}
`,

  linkedin: (content, tone) => `
You are a professional content strategist.

Tone: ${tone}

Create LinkedIn content from this blog.

Return plain text only.

Include:
- 1 strong LinkedIn post

Content:
${content}
`,

  twitter: (content, tone) => `
You are an X/Twitter strategist.

Tone: ${tone}

Create Twitter content from this blog.

Return plain text only.

Include:
- 1 thread
- 2 short tweets

Content:
${content}
`,

  youtube: (content, tone) => `
You are a YouTube Shorts strategist.

Tone: ${tone}

Create YouTube Shorts content from this blog.

Return plain text only.

Include:
- 1 short script

Content:
${content}
`,
};

export async function POST(req) {
  try {
    // 1. Authenticate the user securely on the backend
    const user = await currentUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check the user's plan and their current usage count
    const isLifetimeMember = user.publicMetadata?.plan === "lifetime";
    const usageCount = Number(user.privateMetadata?.usageCount) || 0;
    const MAX_FREE_TRIPS = 5;

    // 3. Enforce the free trial limit
    if (usageCount >= MAX_FREE_TRIPS && !isLifetimeMember) {
      return Response.json(
        { error: "Free trial limit reached. Please upgrade." }, 
        { status: 402 }
      );
    }

    const { content, tone, platform } = await req.json();

    if (!content || !platform) {
      return Response.json(
        { error: "Missing content or platform" },
        { status: 400 }
      );
    }

    const prompt = prompts[platform](content, tone);

    // 4. Generate the AI content
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    // 5. If successful and not a lifetime member, increment their usage count
    if (!isLifetimeMember) {
      // Initialize the async client required for Clerk v6
      const client = await clerkClient(); 
      
      await client.users.updateUserMetadata(user.id, {
        privateMetadata: {
          ...user.privateMetadata, // Preserve any existing private metadata
          usageCount: usageCount + 1,
        },
      });
    }

    return Response.json({
      content: response.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: error.message || "Generation failed",
      },
      {
        status: 500,
      }
    );
  }
}