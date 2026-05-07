import Groq from "groq-sdk";
import { buildPrompts } from "@/lib/prompts";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {

    const { content } = await req.json();

    console.log("INPUT:", content);

    const prompts = buildPrompts(content);

    const resultsArray = await Promise.all(

      Object.entries(prompts).map(async ([key, prompt]) => {

        console.log("Generating:", key);

        const response = await groq.chat.completions.create({

          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

        });

        console.log("SUCCESS:", key);

        return [
          key,
          response.choices[0].message.content
        ];

      })

    );

    return Response.json(
      Object.fromEntries(resultsArray)
    );

  } catch (error) {

    console.error("FULL ERROR:");
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