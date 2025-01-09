import {GoogleGenerativeAI} from '@google/generative-ai'
import { Document } from '@langchain/core/documents'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
    model : 'gemini-1.5-flash',  
})

export const generate_summary = async (diff : string) => {
    console.log(typeof(diff));
    const response = await model.generateContent([
        `For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \' + \' means it was added.
A line that starting with \` - \` means that line was deleted.
A line that starts with neither \' + \' nor \' - \' is code given for context and better understanding.
It is not part of the diff.
[...]
EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from 101 to 100 [packages/server/recordings_api.ta).
* Fixed a typo in the github action name [github/workflows/gpt-commit-summarizer.yml)
* Moved the l'actokit initialization to a separate file (src/octokit.ts], [src/index.to]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts)
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this examples list.
The last comment does not include the file names,
  because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments...
Please summarise the following diff file: \n\n${diff}`
    ])

    return response.response.text();

}

export const summariseCode = async (doc: Document) => {
    // console.log('generating summary for', doc.metadata.source);
    const code = doc.pageContent.slice(0, 10000);
    try {
        const response = await model.generateContent([
            `You are an intelligent senior software developer who specializes in onboarding new developers.
            You are onboarding a new developer who is a junior software developer and explain to them the purpose of the ${doc.metadata.source} file.
            Here is the code snippet:
            ---
            ${code}
            ---
            Give a brief explanation of the purpose of the file in no more than 100 words.`
        ]);
    
        return response.response.text();
        
    } catch (error) {
        return `error in summary generation for ${doc.metadata.source} and code length = ${code.length}`
    }
}


export const generateEmbedding = async (summary: string) => {
    const model = genAI.getGenerativeModel({
        model: 'text-embedding-004',
    })

    const result = await model.embedContent(summary);
    const embedding = result.embedding;
    return embedding;
}
