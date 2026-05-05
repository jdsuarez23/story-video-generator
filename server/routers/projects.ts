import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { projects, scenes, projectInputs } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const projectsRouter = router({
  // Get all projects for the current user
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, 1)) // guest user id
        .orderBy(desc(projects.createdAt));

      return userProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }),

  // Get a specific project by ID
  getById: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (project.length === 0) {
          return null;
        }

        return project[0];
      } catch (error) {
        console.error('Error fetching project:', error);
        return null;
      }
    }),

  // Create a new project
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        synopsis: z.string().optional(),
        userIdea: z.string().min(1),
        numClips: z.number().min(1).max(100),
        clipDurationSeconds: z.number().min(10).max(300),
        referenceImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Sin DB: devolver ID temporal para que el pipeline pueda continuar
      if (!db) {
        console.warn('[projects.create] DB not available, returning temp ID');
        return {
          success: true,
          projectId: Date.now(),
          warning: 'Database not available — using temporary project ID',
        };
      }

      try {
        // Create the project
        await db.insert(projects).values({
          userId: 1, // guest user
          title: input.title,
          synopsis: input.synopsis || null,
          status: 'CREATED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Get the inserted project (fetch it back)
        const createdProject = await db
          .select()
          .from(projects)
          .where(eq(projects.userId, 1))
          .orderBy(desc(projects.createdAt))
          .limit(1);

        const projectId = createdProject[0]?.id;

        // Create project input record
        await db.insert(projectInputs).values({
          projectId: Number(projectId),
          userIdea: input.userIdea,
          numClips: input.numClips,
          clipDurationSeconds: input.clipDurationSeconds,
          referenceImageUrl: input.referenceImageUrl || null,
          createdAt: new Date(),
        });

        return {
          success: true,
          projectId: Number(projectId),
        };
      } catch (error) {
        console.error('Error creating project:', error);
        // Fallback a ID temporal en vez de 500
        return {
          success: true,
          projectId: Date.now(),
          warning: 'DB error — using temporary project ID',
        };
      }
    }),

  // Update project status
  updateStatus: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        status: z.enum([
          'CREATED',
          'STRUCTURED',
          'PROMPTS_GENERATED',
          'STORYBOARD_GENERATED',
          'NARRATION_GENERATED',
          'VIDEO_GENERATED',
          'COMPLETED',
          'FAILED',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Verify ownership
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error('Project not found or unauthorized');
        }

        await db
          .update(projects)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        return { success: true };
      } catch (error) {
        console.error('Error updating project:', error);
        throw new Error('Failed to update project');
      }
    }),

  // Get scenes for a project
  getScenes: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        // Verify ownership
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          return [];
        }

        const projectScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId))
          .orderBy(scenes.sceneNumber);

        return projectScenes;
      } catch (error) {
        console.error('Error fetching scenes:', error);
        return [];
      }
    }),

  // Add a scene to a project
  addScene: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        sceneNumber: z.number(),
        title: z.string(),
        description: z.string(),
        dialogue: z.string().optional(),
        mood: z.string().optional(),
        durationSeconds: z.number(),
        storyboardImageUrl: z.string().optional(),
        status: z.enum([
          'PENDING',
          'PROMPTS_READY',
          'STORYBOARD_GENERATED',
          'NARRATION_GENERATED',
          'VIDEO_GENERATED',
          'COMPLETED',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Verify ownership
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error('Project not found or unauthorized');
        }

        await db.insert(scenes).values({
          projectId: input.projectId,
          sceneNumber: input.sceneNumber,
          title: input.title,
          description: input.description,
          dialogue: input.dialogue || null,
          mood: input.mood || null,
          durationSeconds: input.durationSeconds,
          storyboardImageUrl: input.storyboardImageUrl || null,
          status: input.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error('Error adding scene:', error);
        throw new Error('Failed to add scene');
      }
    }),

  // Delete a project
  delete: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Verify ownership
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error('Project not found or unauthorized');
        }

        // Delete scenes first (foreign key constraint)
        await db.delete(scenes).where(eq(scenes.projectId, input.projectId));

        // Delete project inputs
        await db
          .delete(projectInputs)
          .where(eq(projectInputs.projectId, input.projectId));

        // Delete project
        await db.delete(projects).where(eq(projects.id, input.projectId));

        return { success: true };
      } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project');
      }
    }),
});
