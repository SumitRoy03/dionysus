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
})

