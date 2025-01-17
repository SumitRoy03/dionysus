import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
import { Document } from '@langchain/core/documents';
import { db } from '@/server/db';
import {GoogleGenerativeAI} from '@google/generative-ai'
import { loadGithubLoader } from './github-loader';

import { writeFile, readFile, appendFile, access } from 'fs/promises';
import { constants,mkdirSync } from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'summaries');
const SUMMARY_FILE = path.join(STORAGE_DIR, 'code-summaries.csv');

// Helper to ensure storage directory exists
const ensureStorageDir = async () => {
    try {
        await access(STORAGE_DIR, constants.F_OK);
    } catch {
        await mkdirSync(STORAGE_DIR, { recursive: true });
        // Create empty CSV with headers if it doesn't exist
        await writeFile(SUMMARY_FILE, 'fileSource,summary\n');
    }
};

// Helper to check if file exists
const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
};


// Helper to read existing summaries
const readExistingSummaries = async (): Promise<Map<string, string>> => {
    const summaries = new Map<string, string>();
    try {
        if (await fileExists(SUMMARY_FILE)) {
            const content = await readFile(SUMMARY_FILE, 'utf-8');
            content.split('\n').forEach(line => {
                const [source, summary] = line.split(',');
                if (source && summary) {
                    summaries.set(source, summary);
                }
            });
        }
    } catch (error) {
        console.error('Error reading summaries:', error);
    }
    return summaries;
};

// Store new summary
const storeSummary = async (fileSource: string, summary: string) => {
    const csvLine = `${fileSource},${summary.replace(/,/g, ';')}\n`;
    await appendFile(SUMMARY_FILE, csvLine);
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)


const model = genAI.getGenerativeModel({
    model : 'gemini-1.5-flash',  
})


// Enhanced version of summariseCode with better error handling and rate limiting
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
    ensureStorageDir()
    const tryGenerateSummary = async (attempt: number = 1): Promise<string> => {
        try {
            const code = prepareCode(doc.pageContent);
            if (!code) {
                return `Empty or invalid code in ${doc.metadata.source}`;
            }

            const response = await model.generateContent([
                `You are an intelligent senior software developer who specializes in onboarding new developers.
                You are onboarding a new developer who is a junior software developer and explain to them the purpose of the ${doc.metadata.source} file.
                Here is the code snippet:
                ---
                ${code}
                ---
                Give a brief explanation of the purpose of the file in no more than 100 words.`
            ]);
            const summary = response.response.text();
            await storeSummary(doc.metadata.source, summary);
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

// Enhanced version of generateEmbeddings with batching and progress tracking
export const generateEmbeddings = async (docs: Document[]) => {
    const batchSize = 5; // Process 5 documents at a time
    const results: Array<{
        summary: string;
        embedding: number[];
        SourceCode: string;
        fileName: string;
    }> = [];

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(docs.length/batchSize)}`);

        const batchResults = await Promise.all(batch.map(async (doc, index) => {
            try {
                const summary = await summariseCode(doc);
                console.log(`✓ Generated summary for ${doc.metadata.source}`);
                
                const embedding = await generateEmbedding(summary);
                console.log(`✓ Generated embedding for ${doc.metadata.source}`);

                return {
                    summary,
                    embedding,
                    SourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                    fileName: doc.metadata.source,
                };
            } catch (error) {
                console.error(`Failed processing ${doc.metadata.source}:`, error);
                return null;
            }
        }));

        results.push(...batchResults.filter((result): result is { summary: string; embedding: number[]; SourceCode: string; fileName: string } => result !== null));
        
        // Add a small delay between batches to avoid overwhelming the API
        if (i + batchSize < docs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
};

export const indexGithubResponse = async (githubUrl: string, githubToken?: string) => {
    try {
        const docs = await loadGithubLoader(githubUrl, githubToken);
        console.log(`Loaded ${docs.length} documents from GitHub`);
        
        const allEmbeddings = await generateEmbeddings(docs);
        console.log(`Successfully processed ${allEmbeddings.length} of ${docs.length} files`);
        
        return allEmbeddings;
    } catch (error) {
        console.error('Failed to index GitHub repository:', error);
        throw error;
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

const testRepo = async () => {
    const results = await indexGithubResponse('https://github.com/docker/scout-cli');
    console.log(`Processed ${results.length} files`);
};

await testRepo();