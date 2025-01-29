import {GoogleGenerativeAI} from '@google/generative-ai'
import { Document } from '@langchain/core/documents'
import { writeFile, readFile, appendFile, access } from 'fs/promises';
import { constants,mkdirSync } from 'fs';
import path from 'path';



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

// export const summariseCode = async (doc: Document) => {
//     // console.log('generating summary for', doc.metadata.source);
//     const code = doc.pageContent.slice(0, 10000);
//     try {
//         const response = await model.generateContent([
//             `You are an intelligent senior software developer who specializes in onboarding new developers.
//             You are onboarding a new developer who is a junior software developer and explain to them the purpose of the ${doc.metadata.source} file.
//             Here is the code snippet:
//             ---
//             ${code}
//             ---
//             Give a brief explanation of the purpose of the file in no more than 100 words.`
//         ]);
    
//         return response.response.text();
        
//     } catch (error) {
//         return `error in summary generation for ${doc.metadata.source} and code length = ${code.length}`
//     }
// }


export const summariseCode = async (doc: Document) => {

    const maxRetries = 3;
    const retryDelay = 1000; // 1 second delay between retries
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Helper function to clean and validate code
    const prepareCode = (code: string) => {
        if (!code.trim()) return null;
        return code.slice(0, 10000); // Keep the 10k char limit
    };
    const tryGenerateSummary = async (attempt: number = 1): Promise<string> => {
        try {
            const code = prepareCode(doc.pageContent);
            if (!code) {
                return `Empty or invalid code in ${doc.metadata.source}`;
            }
            const fileName = path.basename(doc.metadata.source);
            const fileExtension = path.extname(fileName);
            const response = await model.generateContent([
                `You are an expert software developer creating documentation for a codebase. Your task is to analyze the following code file and provide a clear, concise summary.

File: ${fileName}
Type: ${fileExtension} file
Context: Part of a larger software project

Instructions:
1. Focus on explaining the main purpose and functionality of this file
2. Identify key features or components implemented
3. Note any important dependencies or integrations
4. Keep the summary under 100 words and highly technical

If this is a:
- Component: Describe its UI/UX purpose and key props
- Utility file: List main functions and their purposes
- Type definition: Explain the key interfaces/types
- Configuration: Describe what it configures
- Test file: Explain what it tests

Code to analyze:
\`\`\`${fileExtension}
${code}
\`\`\`

Summary format: "This [file type] [main purpose]. It [key functionality]. [Important details if any]."`
            ]);
            const summary = response.response.text();
            return summary;
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed for ${doc.metadata.source}:`, error);
            
            if (attempt < maxRetries) {
                await delay(retryDelay * attempt); // Exponential backoff
                return tryGenerateSummary(attempt + 1);
            }
            
            throw error;
        }
    };

    try {
        return await tryGenerateSummary();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return `Failed to generate summary for ${doc.metadata.source} after ${maxRetries} attempts. Error: ${errorMessage}`;
    }
};  



export const generateEmbedding = async (summary: string) => {
    const model = genAI.getGenerativeModel({
        model: 'text-embedding-004',
    })

    const result = await model.embedContent(summary);
    const embedding = result.embedding;
    return embedding.values;
}
