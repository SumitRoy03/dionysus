import { db } from '@/server/db';
import { Octokit } from 'octokit'
import axios from 'axios';
import { generate_summary } from './gemini';
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    });


// WIP : commitAuthorName might be wrong!

type Response = {
    commitHash : string;
    commitMessage : string;
    commitAuthorName : string;
    commitAuthorAvatar : string;
    commitDate : string;
}

export const getCommitHashes = async (githubUrl : string): Promise<Response[]> => {
    const cleanedUrl = githubUrl.replace(/\/$/, '');

// Split the URL and extract owner and repo
const [owner, repo] = cleanedUrl.split('/').slice(-2);

if (!owner || !repo) {
    throw new Error('Invalid github url');
}

    const {data} = await octokit.rest.repos.listCommits({
        owner : owner,
        repo : repo,
    })

    const sortedCommits = data.sort((a:any, b:any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[];
    return sortedCommits.slice(0, 15).map((commit) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit?.commit?.author.name ?? "",
        commitAuthorAvatar: commit?.author?.avatar_url ?? "",
        commitDate: commit?.commit?.author.date ?? "",
    }))
}

export const pollCommits = async (projectId : string) => {
    const { project, githubUrl } = await fetchProjetGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);

    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
    const summaryResponses = await Promise.allSettled(unprocessedCommits.map((commit) => {
        return summariseCommit(githubUrl, commit.commitHash);
    }))
    const summaries = summaryResponses.map((summary) => {
        if(summary.status === 'fulfilled') {
            return summary.value as string;
        }
        return '';
    })
        const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            return {
            projectId,
            commitHash: unprocessedCommits[index]!.commitHash,
            commitMessage: unprocessedCommits[index]!.commitMessage,
            commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
            commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
            commitDate: new Date(unprocessedCommits[index]!.commitDate),
            summary
            }
        })
    })

    return commits;
}

async function summariseCommit(githubUrl: string, commitHash: string) {
    //get the diff, pass it to the ai model and return the response
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`,{
        headers: {
            Accept: 'application/vnd.github.v3.diff'
        }
    });
    return await generate_summary(data) || '';
}

async function fetchProjetGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: projectId
        },
        select: {
            githubUrl: true
        }
    })

    if(!project) {
        throw new Error('Project not found');
    }

    return { project, githubUrl: project.githubUrl };
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId
        }
    })

    const processedCommitHashes = processedCommits.map((commit) => commit.commitHash);

    const unprocessedCommits = commitHashes.filter((commit) => !processedCommitHashes.includes(commit.commitHash));

    return unprocessedCommits;
}

