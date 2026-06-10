import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { sendEmail } from "@/actions/email";

import db from "@/db";
import { user as userTable } from "@/db/schema";
import { BMSCE_EMAIL_ERROR, BMSCE_EMAIL_ERROR_CODE, isBmsceEmail } from "@/lib/bmsce-email";
import { syncExternalProfileImageToS3 } from "@/lib/s3/profile-image";

function rejectNonBmsceEmail(email: string | null | undefined) {
  if (!email || !isBmsceEmail(email)) {
    throw new APIError("BAD_REQUEST", { message: BMSCE_EMAIL_ERROR_CODE });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" || ctx.path === "/sign-in/email") {
        rejectNonBmsceEmail(ctx.body?.email as string | undefined);
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          rejectNonBmsceEmail(user.email);
          return { data: user };
        },
        after: async (user) => {
          try {
            const s3Url = await syncExternalProfileImageToS3(user.id, user.image);
            if (s3Url) {
              await db
                .update(userTable)
                .set({ image: s3Url })
                .where(eq(userTable.id, user.id));
            }
          } catch (error) {
            console.error("Failed to store OAuth profile image in S3:", error);
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const account = await db.query.user.findFirst({
            where: eq(userTable.id, session.userId),
            columns: { email: true },
          });
          rejectNonBmsceEmail(account?.email);
          return { data: session };
        },
        after: async (session) => {
          try {
            const account = await db.query.user.findFirst({
              where: eq(userTable.id, session.userId),
              columns: { id: true, image: true },
            });

            if (!account?.image) return;

            const s3Url = await syncExternalProfileImageToS3(
              account.id,
              account.image,
            );

            if (s3Url) {
              await db
                .update(userTable)
                .set({ image: s3Url })
                .where(eq(userTable.id, account.id));
            }
          } catch (error) {
            console.error("Failed to sync profile image to S3 on login:", error);
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
  onAPIError: {
    errorURL: "/auth/login",
  },
});
