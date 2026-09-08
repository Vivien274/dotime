import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  entries: defineTable({
    title: v.string(),
    type: v.union(v.literal("pro"), v.literal("perso"), v.literal("entreprises")),
    startTime: v.string(), // "HH:MM"
    endTime: v.string(),   // "HH:MM"
    startHour: v.number(),
    endHour: v.number(),
    durationHours: v.number(),
    date: v.string(),      // "YYYY-MM-DD"
  }).index("by_date", ["date"]),

  topics: defineTable({
    name: v.string(),
    type: v.union(v.literal("pro"), v.literal("perso"), v.literal("entreprises")),
    icon: v.string(),
    isCustom: v.boolean(),
  }),
});
