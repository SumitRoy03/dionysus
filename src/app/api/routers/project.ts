import { pollCommits } from "@/lib/github";
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
    })
})

