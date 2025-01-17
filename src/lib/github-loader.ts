import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

interface ProcessingStatus {
    fileName: string;
    attempts: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    summary?: string;
    embedding?: number[];
}

//Working fine and successfully loads the docs
export const loadGithubLoader = async (githubUrl:string, githubToken?: string) => {

        const loader = new GithubRepoLoader(githubUrl, {
           accessToken: githubToken || process.env.GITHUB_TOKEN,
           branch: 'master',
           ignoreFiles: ['package.json', 'package-lock.json', 'yarn.lock', 'node_modules', 'dist', 'build', 'coverage', 'public', 'out', 'tmp', 'temp', 'cache','pnpm-lock.yaml', 'bun.lockb'],
           recursive: true,
           unknown: 'warn',
           maxConcurrency: 3,
        });
   
        const docs = await loader.load();
   
        return docs;
}

//main function
export const indexGithubResponse = async (projectId: string, githubUrl:string, githubToken?: string) => {
    const docs = await loadGithubLoader(githubUrl, githubToken);

    const allEmbeddings = await generateEmbeddings(docs);
// Avoiding db entry for testing the function
    await Promise.allSettled(allEmbeddings.map(async (embedding,index) => {

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
                summary: embedding.summary,
                sourceCode: embedding.SourceCode,
                fileName: embedding.fileName,
                projectId,
            }
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id} 
        `

    }));
    return docs;
}

export const generateEmbeddings = async (docs: Document[]) => {
    // Initialize status tracking for all files
    const processingStatus = new Map<string, ProcessingStatus>();
    docs.forEach(doc => {
        processingStatus.set(doc.metadata.source, {
            fileName: doc.metadata.source,
            attempts: 0,
            status: 'pending'
        });
    });

    const results: Array<{
        summary: string;
        embedding: number[];
        SourceCode: string;
        fileName: string;
    }> = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Process a single document with retries
    const processDocument = async (doc: Document): Promise<boolean> => {
        const status = processingStatus.get(doc.metadata.source)!;
        status.status = 'processing';
        status.attempts++;

        try {
            // Generate summary with longer timeout
            console.log(`Generating summary for ${doc.metadata.source} (Attempt ${status.attempts})`);
            const summary = await Promise.race([
                summariseCode(doc),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
            ]) as string;

            // Add delay after summary generation
            await delay(1000);

            // Generate embedding with longer timeout
            console.log(`Generating embedding for ${doc.metadata.source} (Attempt ${status.attempts})`);
            const embedding = await Promise.race([
                generateEmbedding(summary),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
            ]) as number[];

            // Store successful result
            results.push({
                summary,
                embedding,
                SourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                fileName: doc.metadata.source
            });

            status.status = 'completed';
            status.summary = summary;
            status.embedding = embedding;
            
            console.log(`✓ Successfully processed ${doc.metadata.source}`);
            return true;

        } catch (error) {
            if (error instanceof Error) {
                status.error = error.message;
            } else {
                status.error = String(error);
            }
            console.error(`Failed processing ${doc.metadata.source} (Attempt ${status.attempts}):`, error);
            
            // If we haven't exceeded max retries, mark for retry
            if (status.attempts < 5) {
                status.status = 'pending';
                const retryDelay = Math.min(1000 * Math.pow(2, status.attempts), 30000);
                await delay(retryDelay);
                return false;
            }

            status.status = 'failed';
            return false;
        }
    };

    // Main processing loop
    let remainingDocs = [...docs];
    let consecutiveFailures = 0;

    while (remainingDocs.length > 0) {
        const doc = remainingDocs[0];
        const status = processingStatus.get(doc!.metadata.source)!;

        // If we've had too many consecutive failures, take a longer break
        if (consecutiveFailures >= 3) {
            console.log('Too many consecutive failures, taking a longer break...');
            await delay(60000); // 1 minute break
            consecutiveFailures = 0;
        }

        const success = await processDocument(doc!);

        if (success) {
            // Remove successfully processed doc from remaining list
            remainingDocs.shift();
            consecutiveFailures = 0;
        } else if (status.status === 'failed') {
            // Remove failed doc after max retries
            remainingDocs.shift();
            consecutiveFailures++;
        } else {
            // Move this doc to the end of the queue for retry
            remainingDocs.shift();
            remainingDocs.push(doc!);
            consecutiveFailures++;
        }

        // Always add a small delay between processing
        await delay(2000);
    }

    // Final status report
    const summary = {
        total: docs.length,
        completed: Array.from(processingStatus.values()).filter(s => s.status === 'completed').length,
        failed: Array.from(processingStatus.values()).filter(s => s.status === 'failed').length
    };

    console.log('\nProcessing Summary:');
    console.log(`Total files: ${summary.total}`);
    console.log(`Successfully processed: ${summary.completed}`);
    console.log(`Failed: ${summary.failed}`);

    if (summary.failed > 0) {
        console.log('\nFailed files:');
        Array.from(processingStatus.values())
            .filter(s => s.status === 'failed')
            .forEach(s => console.log(`- ${s.fileName} (${s.error})`));
    }

    return results;
};

//testing


