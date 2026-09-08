import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const INITIAL_TOPICS = [
  // PRO
  { name: "Réunion", type: "pro" as const, icon: "Video", isCustom: false },
  { name: "Maquette", type: "pro" as const, icon: "Palette", isCustom: false },
  { name: "Dev / Code", type: "pro" as const, icon: "Code2", isCustom: false },
  { name: "Emails & Admin", type: "pro" as const, icon: "Users", isCustom: false },
  { name: "Appel client", type: "pro" as const, icon: "Phone", isCustom: false },
  { name: "Veille", type: "pro" as const, icon: "Sparkles", isCustom: false },

  // PERSO
  { name: "Nuit / Sommeil", type: "perso" as const, icon: "Moon", isCustom: false },
  { name: "Petit déjeuner", type: "perso" as const, icon: "Coffee", isCustom: false },
  { name: "Déjeuner", type: "perso" as const, icon: "Utensils", isCustom: false },
  { name: "Pause café", type: "perso" as const, icon: "Coffee", isCustom: false },
  { name: "Sport", type: "perso" as const, icon: "Dumbbell", isCustom: false },
  { name: "Lecture", type: "perso" as const, icon: "BookOpen", isCustom: false },
  { name: "Dîner & Soirée", type: "perso" as const, icon: "Heart", isCustom: false },

  // ENTREPRISES / ENTP
  { name: "Modifications de Tablo", type: "entreprises" as const, icon: "Globe", isCustom: false },
  { name: "Gestion de projet", type: "entreprises" as const, icon: "Layout", isCustom: false },
  { name: "Facturation & Devis", type: "entreprises" as const, icon: "Briefcase", isCustom: false },
  { name: "Prospection", type: "entreprises" as const, icon: "Zap", isCustom: false },
  { name: "Comptabilité", type: "entreprises" as const, icon: "Briefcase", isCustom: false },
];

/**
 * Récupère tous les sujets
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").collect();
  },
});

/**
 * Ajoute un nouveau sujet personnalisé
 */
export const add = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("pro"), v.literal("perso"), v.literal("entreprises")),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      name: args.name.trim(),
      type: args.type,
      icon: args.icon,
      isCustom: true,
    });
  },
});

/**
 * Initialise les sujets par défaut si la table est vide
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("topics").take(1);
    if (existing.length === 0) {
      for (const topic of INITIAL_TOPICS) {
        await ctx.db.insert("topics", topic);
      }
    }
  },
});
