import { sql } from "drizzle-orm";
import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  status: publicProcedure.query(async () => {
    const checkedAt = new Date().toISOString();
    let database: "operational" | "degraded" = "degraded";

    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        database = "operational";
      }
    } catch {
      database = "degraded";
    }

    const authentication = process.env.OAUTH_SERVER_URL && process.env.VITE_OAUTH_PORTAL_URL ? "operational" : "degraded";
    const fileStorage = process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY ? "operational" : "degraded";
    const services = [
      { key: "platform", label: "المنصة والخادم", status: "operational" as const },
      { key: "database", label: "قاعدة البيانات", status: database },
      { key: "authentication", label: "المصادقة وتسجيل الدخول", status: authentication },
      { key: "fileStorage", label: "تخزين الوثائق", status: fileStorage },
    ];

    return {
      checkedAt,
      overall: services.every(service => service.status === "operational") ? "operational" as const : "degraded" as const,
      services,
    };
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
