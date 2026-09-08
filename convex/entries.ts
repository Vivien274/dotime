import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Récupère les entrées d'une journée donnée, triées chronologiquement
 */
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    return entries.sort((a, b) => a.startHour - b.startHour);
  },
});

/**
 * Récupère les entrées de deux journées consécutives (pour gérer le chevauchement de la nuit)
 */
export const getByDateAndNext = query({
  args: { currentDate: v.string(), nextDate: v.string() },
  handler: async (ctx, args) => {
    const currentEntries = await ctx.db
      .query("entries")
      .withIndex("by_date", (q) => q.eq("date", args.currentDate))
      .collect();

    const nextEntries = await ctx.db
      .query("entries")
      .withIndex("by_date", (q) => q.eq("date", args.nextDate))
      .collect();

    return {
      currentDay: currentEntries.sort((a, b) => a.startHour - b.startHour),
      nextDay: nextEntries.sort((a, b) => a.startHour - b.startHour),
    };
  },
});

/**
 * Ajoute une nouvelle activité
 */
export const add = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("pro"), v.literal("perso"), v.literal("entreprises")),
    startTime: v.string(),
    endTime: v.string(),
    startHour: v.number(),
    endHour: v.number(),
    durationHours: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("entries", {
      title: args.title.trim(),
      type: args.type,
      startTime: args.startTime,
      endTime: args.endTime,
      startHour: args.startHour,
      endHour: args.endHour,
      durationHours: args.durationHours,
      date: args.date,
    });
  },
});

/**
 * Supprime une activité par son ID
 */
export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Supprime toutes les activités d'une date (réinitialisation de la journée)
 */
export const resetDay = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
  },
});

/**
 * Importe par lot des entrées (pour la migration depuis localStorage)
 */
export const importBatch = mutation({
  args: {
    entries: v.array(
      v.object({
        title: v.string(),
        type: v.union(v.literal("pro"), v.literal("perso"), v.literal("entreprises")),
        startTime: v.string(),
        endTime: v.string(),
        startHour: v.number(),
        endHour: v.number(),
        durationHours: v.number(),
        date: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const item of args.entries) {
      const id = await ctx.db.insert("entries", item);
      insertedIds.push(id);
    }
    return insertedIds;
  },
});
