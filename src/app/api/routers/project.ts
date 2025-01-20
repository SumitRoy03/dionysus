import { pollCommits } from "@/lib/github";
import { indexGithubResponse } from "@/lib/github-loader";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ ctx ,input }) => {
        // console.log(input)
        const project = await ctx.db.project.create({
            data: {
                name: input.name,
                githubUrl: input.githubUrl,
                usertoProjects:{
                    create: {
                        userId: ctx.user.userId!
                }
              }
            }
        })
        await Promise.all([
            indexGithubResponse(project.id, input.githubUrl, input.githubToken),
            pollCommits(project.id)
        ]);
        return project;
    }),
    getProjects: protectedProcedure.query(async ({ ctx }) => {
        const projects = await ctx.db.project.findMany({
            where: {
                usertoProjects: {
                    some: {
                        userId: ctx.user.userId!
                    },
                },
                deletedAt: null
                
            }
        })
        return projects;
    }),
    getCommits : protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ ctx, input }) => {
        pollCommits(input.projectId).then().catch(console.error);
        return await ctx.db.commit.findMany({
            where: {
                projectId: input.projectId
            }
        })
    }),
    saveAnswer : protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        fileReferences: z.any()
    })).mutation(async ({ ctx, input }) => {
        return await ctx.db.questions.create({
            data: {
                answer: input.answer,
                fileReferences: input.fileReferences,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!
            }
        })
    }),
    getQuestions: protectedProcedure.input(z.object({
        projectId : z.string()
    })).query(async ({ ctx, input }) => {
        return await ctx.db.questions.findMany({
            where : {
                projectId : input.projectId
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'   
            }
        })
    })
})

