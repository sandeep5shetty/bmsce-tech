"use server";

import { revalidatePath } from "next/cache";

import { and, count, eq, isNull } from "drizzle-orm";

import { getUser } from "@/actions/user";

import db from "@/db";
import {
  list,
  listProject,
  project,
  review,
  savedProject,
  techStack,
  user as userTable,
} from "@/db/schema";
import { validateOrThrow } from "@/validation";

import { NewProject, ProjectMetadata } from "./types";
import { ReviewSchema, newProjectSchema, reviewSchema } from "./validation";

export async function submitProject(data: NewProject) {
  // Validate input data
  validateOrThrow(newProjectSchema, data);

  // 1. Insert the project
  const [projectResult] = await db
    .insert(project)
    .values({
      name: data.name,
      description: data.description,
      body: data.body || null,
      liveLink: data.liveLink,
      codeLink: data.codeLink || null,
    })
    .returning();

  if (!projectResult) {
    throw new Error("Failed to create project");
  }

  // 2. Insert tech stack items if provided
  if (data.techStack && data.techStack.length > 0) {
    const techStackValues = data.techStack.map((tech) => ({
      label: tech.label,
      image: tech.image || null,
      projectId: projectResult.id,
    }));

    try {
      await db.insert(techStack).values(techStackValues);
    } catch {
      // If tech stack insertion fails, delete the project to maintain consistency
      await db.delete(project).where(eq(project.id, projectResult.id));
      throw new Error("Failed to create project with tech stack");
    }
  }

  revalidatePath("/dashboard/projects");

  return projectResult;
}

export async function getSiteMetadata(
  url: string,
): Promise<ProjectMetadata | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetadataFetcher/1.0)",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract Open Graph metadata
    const ogTitle = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    );
    const ogDescription = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    );
    const ogImage = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    );

    // Extract Twitter Card metadata
    const twitterCard = html.match(
      /<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i,
    );
    const twitterTitle = html.match(
      /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i,
    );
    const twitterDescription = html.match(
      /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i,
    );
    const twitterImage = html.match(
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    );

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string | null): string | null => {
      if (!text) return null;
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'");
    };

    // Extract HTML metadata
    const htmlTitle = html.match(/<title>([^<]+)<\/title>/i);
    const htmlDescription = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    );

    return {
      openGraph: {
        title: decodeHtmlEntities(ogTitle?.[1] || null),
        description: decodeHtmlEntities(ogDescription?.[1] || null),
        image: ogImage?.[1] || null,
      },
      twitter: {
        card: twitterCard?.[1] || null,
        title: decodeHtmlEntities(twitterTitle?.[1] || null),
        description: decodeHtmlEntities(twitterDescription?.[1] || null),
        image: twitterImage?.[1] || null,
      },
      html: {
        title: decodeHtmlEntities(htmlTitle?.[1] || null),
        description: decodeHtmlEntities(htmlDescription?.[1] || null),
      },
    };
  } catch (error) {
    console.error("Error fetching site metadata:", error);
    return null;
  }
}

export async function submitReview(data: ReviewSchema) {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate input data
  validateOrThrow(reviewSchema, data);

  // Get user's current video info from DB
  const userData = await db.query.user.findFirst({
    where: eq(userTable.id, user.id),
    columns: {
      currentVideoNumber: true,
      currentVideoLink: true,
    },
  });

  // Insert the review
  const [reviewResult] = await db
    .insert(review)
    .values({
      projectId: data.projectId,
      userId: user.id,
      design: data.design,
      userExperience: data.userExperience,
      creativity: data.creativity,
      functionality: data.functionality,
      hireability: data.hireability,
      remark: data.remark ? JSON.stringify(data.remark) : null,
      videoNumber: userData?.currentVideoNumber || null,
      videoLink: userData?.currentVideoLink || null,
    })
    .returning();

  if (!reviewResult) {
    throw new Error("Failed to submit review");
  }

  revalidatePath(`/lists/[id]`); // Revalidate list pages where this project might appear
  revalidatePath(`/projects/${data.projectId}`);

  return reviewResult;
}

export async function toggleProjectSave({ projectId }: { projectId: string }) {
  const user = await getUser();
  if (!user) {
    throw new Error("You must be logged in to save projects");
  }

  // Check if user already saved this project
  const existingSave = await db.query.savedProject.findFirst({
    where: and(
      eq(savedProject.userId, user.id),
      eq(savedProject.projectId, projectId),
    ),
  });

  if (existingSave) {
    // Unsave - remove the bookmark
    await db.delete(savedProject).where(eq(savedProject.id, existingSave.id));
    return { saved: false };
  } else {
    // Save - create a bookmark
    await db.insert(savedProject).values({
      userId: user.id,
      projectId,
    });
    return { saved: true };
  }
}

// Get single project details for modal
export async function getProjectDetails(
  projectId: string,
  reviewOwnerId?: string,
) {
  const user = await getUser();

  const projectData = await db.query.project.findFirst({
    where: eq(project.id, projectId),
    with: {
      techStack: {
        columns: {
          id: true,
          label: true,
          image: true,
        },
      },
    },
  });

  if (!projectData) {
    throw new Error("Project not found");
  }

  // Fetch review if ownerId is provided
  let projectReview = null;
  if (reviewOwnerId) {
    projectReview = await db.query.review.findFirst({
      where: and(
        eq(review.projectId, projectId),
        eq(review.userId, reviewOwnerId),
      ),
    });
  }

  // Check if user saved this project
  let userSaved = false;
  if (user) {
    const saved = await db.query.savedProject.findFirst({
      where: and(
        eq(savedProject.userId, user.id),
        eq(savedProject.projectId, projectData.id),
      ),
    });
    userSaved = !!saved;
  }

  // Count saved by users
  const [savedByResult] = await db
    .select({ count: count() })
    .from(savedProject)
    .where(eq(savedProject.projectId, projectData.id));

  return {
    ...projectData,
    review: projectReview,
    userSaved,
    _count: {
      savedBy: savedByResult?.count || 0,
    },
  };
}

export async function getRandomListProject(listId: string) {
  const user = await getUser();

  // Get all not-reviewed projects in this list
  const notReviewedProjects = await db
    .select({
      listProject: listProject,
      project: project,
    })
    .from(listProject)
    .innerJoin(project, eq(listProject.projectId, project.id))
    .leftJoin(review, eq(review.projectId, project.id))
    .where(and(eq(listProject.listId, listId), isNull(review.id)))
    .groupBy(listProject.id, project.id);

  if (notReviewedProjects.length === 0) {
    return null;
  }

  // Pick a random project from the not-reviewed ones
  const randomIndex = Math.floor(Math.random() * notReviewedProjects.length);
  const randomProjectData = notReviewedProjects[randomIndex];

  if (!randomProjectData) {
    return null;
  }

  // Fetch tech stack for the project
  const techStackData = await db.query.techStack.findMany({
    where: eq(techStack.projectId, randomProjectData.project.id),
    columns: {
      id: true,
      label: true,
      image: true,
    },
  });

  // Check if user saved this project
  let userSaved = false;
  if (user) {
    const saved = await db.query.savedProject.findFirst({
      where: and(
        eq(savedProject.userId, user.id),
        eq(savedProject.projectId, randomProjectData.project.id),
      ),
    });
    userSaved = !!saved;
  }

  return {
    ...randomProjectData.listProject,
    project: {
      ...randomProjectData.project,
      techStack: techStackData,
    },
    userSaved,
  };
}

export async function deleteProject(projectId: string) {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized: You must be logged in to delete projects");
  }

  // Validate projectId format
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project ID");
  }

  // Verify the project exists and user has permission to delete it
  // Check if the project is in any of the user's lists
  const userListsWithProject = await db.query.list.findMany({
    where: eq(list.userId, user.id),
    with: {
      listProjects: {
        where: eq(listProject.projectId, projectId),
      },
    },
  });

  const hasPermission = userListsWithProject.some(
    (userList) => userList.listProjects.length > 0,
  );

  if (!hasPermission) {
    throw new Error(
      "Forbidden: You can only delete projects from your own lists",
    );
  }

  // Verify project exists
  const projectData = await db.query.project.findFirst({
    where: eq(project.id, projectId),
    columns: {
      id: true,
    },
  });

  if (!projectData) {
    throw new Error("Project not found");
  }

  try {
    // Delete in proper order (reverse of creation)
    // Note: Some deletions may be handled by cascade depending on your DB setup

    // 1. Delete related tech stack items
    await db.delete(techStack).where(eq(techStack.projectId, projectId));

    // 2. Delete related reviews
    await db.delete(review).where(eq(review.projectId, projectId));

    // 3. Delete saved project bookmarks
    await db.delete(savedProject).where(eq(savedProject.projectId, projectId));

    // 4. Delete list project associations
    await db.delete(listProject).where(eq(listProject.projectId, projectId));

    // 5. Finally, delete the project itself
    await db.delete(project).where(eq(project.id, projectId));

    revalidatePath("/dashboard/projects");
    revalidatePath("/projects");
    revalidatePath(`/lists/${userListsWithProject[0]?.id}`);

    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project. Please try again.");
  }
}
