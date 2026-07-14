import Groq from "groq-sdk";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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
    // 1. Authenticate the user securely on the backend using Kinde
    const { isAuthenticated } = getKindeServerSession();
    const isAuthed = await isAuthenticated();
    
    if (!isAuthed) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, tone, platform } = await req.json();

    if (!content || !platform) {
      return Response.json(
        { error: "Missing content or platform" },
        { status: 400 }
      );
    }

    const prompt = prompts[platform](content, tone);

    // 2. Generate the AI content using an active Groq model tier
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

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