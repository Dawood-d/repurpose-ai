export const buildPrompts = (input) => {
  return {
    instagram: `
Create:
- 3 Instagram captions
- 1 carousel
- 2 reel scripts

Content:
${input}
`,

    linkedin: `
Create:
- 2 LinkedIn posts
- 1 authority style post

Content:
${input}
`,

    twitter: `
Create:
- 1 Twitter thread
- 3 tweets

Content:
${input}
`,

    youtube: `
Create:
- 1 YouTube Shorts script

Content:
${input}
`,
  };
};