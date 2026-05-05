import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, scenes, projectInputs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get projects: database not available");
    return [];
  }

  try {
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return userProjects;
  } catch (error) {
    console.error("[Database] Failed to get user projects:", error);
    return [];
  }
}

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get project: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (result.length === 0 || result[0].userId !== userId) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get project:", error);
    return null;
  }
}

export async function createProject(
  userId: number,
  title: string,
  synopsis: string | null
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create project: database not available");
  }

  try {
    await db.insert(projects).values({
      userId,
      title,
      synopsis,
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fetch the created project
    const created = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create project:", error);
    throw error;
  }
}

export async function updateProjectStatus(
  projectId: number,
  status: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update project: database not available");
  }

  try {
    await db
      .update(projects)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to update project status:", error);
    throw error;
  }
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot delete project: database not available");
  }

  try {
    // Delete scenes first
    await db.delete(scenes).where(eq(scenes.projectId, projectId));

    // Delete project inputs
    await db.delete(projectInputs).where(eq(projectInputs.projectId, projectId));

    // Delete project
    await db.delete(projects).where(eq(projects.id, projectId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to delete project:", error);
    throw error;
  }
}

// ============================================================================
// SCENE OPERATIONS
// ============================================================================

export async function getProjectScenes(projectId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scenes: database not available");
    return [];
  }

  try {
    const projectScenes = await db
      .select()
      .from(scenes)
      .where(eq(scenes.projectId, projectId))
      .orderBy(scenes.sceneNumber);

    return projectScenes;
  } catch (error) {
    console.error("[Database] Failed to get scenes:", error);
    return [];
  }
}

export async function getSceneById(sceneId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scene: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get scene:", error);
    return null;
  }
}

export async function createScene(
  projectId: number,
  sceneNumber: number,
  title: string,
  description: string,
  durationSeconds: number,
  status: string = 'PENDING'
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create scene: database not available");
  }

  try {
    await db.insert(scenes).values({
      projectId,
      sceneNumber,
      title,
      description,
      durationSeconds,
      status: status as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[Database] Failed to create scene:", error);
    throw error;
  }
}

export async function updateSceneStatus(
  sceneId: number,
  status: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update scene: database not available");
  }

  try {
    await db
      .update(scenes)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to update scene status:", error);
    throw error;
  }
}

export async function updateSceneUrls(
  sceneId: number,
  updates: {
    storyboardImageUrl?: string;
    narrationAudioUrl?: string;
    videoClipUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update scene: database not available");
  }

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.storyboardImageUrl) {
      updateData.storyboardImageUrl = updates.storyboardImageUrl;
    }
    if (updates.narrationAudioUrl) {
      updateData.narrationAudioUrl = updates.narrationAudioUrl;
    }
    if (updates.videoClipUrl) {
      updateData.videoClipUrl = updates.videoClipUrl;
    }

    await db
      .update(scenes)
      .set(updateData)
      .where(eq(scenes.id, sceneId));

    return true;
  } catch (error) {
    console.error("[Database] Failed to update scene URLs:", error);
    throw error;
  }
}

// ============================================================================
// PROJECT INPUT OPERATIONS
// ============================================================================

export async function createProjectInput(
  projectId: number,
  userIdea: string,
  numClips: number,
  clipDurationSeconds: number,
  referenceImageUrl?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create project input: database not available");
  }

  try {
    await db.insert(projectInputs).values({
      projectId,
      userIdea,
      numClips,
      clipDurationSeconds,
      referenceImageUrl: referenceImageUrl || null,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[Database] Failed to create project input:", error);
    throw error;
  }
}

export async function getProjectInput(projectId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get project input: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(projectInputs)
      .where(eq(projectInputs.projectId, projectId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get project input:", error);
    return null;
  }
}
