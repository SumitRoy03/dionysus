'use server'

import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from '@/server/db'

const google = createGoogleGenerativeAI({
    apiKey : process.env.GEMINI_API_KEY
})

export async function askQuestion (question:string, projectId:string) {
    const stream = createStreamableValue()

    const queryVector = await generateEmbedding(question);
    const vectorQuery = `[${queryVector.join(',')}]`

    const result  = await db.$queryRaw`
    SELECT "fileName", "sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC 
        LIMIT 10
        ` as {fileName : string, sourceCode: string, summary: string, similarity:number}[]

    let context = '';

    for(const doc of result) {
        context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    (
        async () => {
            const {textStream} = await streamText({
                model: google('gemini-1.5-flash'),
                prompt: `
                    You are a code-focused AI assistant helping to explain codebases. Your target audience is technical interns seeking to understand the code structure and functionality.

When analyzing code or specific files, provide detailed, step-by-step explanations with relevant code snippets. Format all responses in markdown syntax.

When presented with context, only use information explicitly provided in the context block. If the context doesn't contain sufficient information to answer the question, respond with "I cannot answer this question based on the provided context."

START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

START QUESTION
${question}
END OF QUESTION

Key guidelines:
- Provide thorough, technically accurate explanations
- Include code snippets when relevant
- Don't make assumptions beyond the provided context
- Focus on clarity and educational value for interns
- If new information contradicts previous responses, clearly state the correction  
                `
            });

            for await (const delta of textStream) {
                stream.update(delta)
            }

            stream.done();
        }
    )()

    return {
        output:stream.value,
        fileReferences: result
    }
} 