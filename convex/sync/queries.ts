/**
 * SYNC QUERIES
 * Query helper per sync engine
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

export const getInstance = query({
  args: { instanceId: v.id("integrationInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    
    if (!instance) {
      return null;
    }

    // Aggiungi companyId dal profile
    const profile = await ctx.db.get(instance.profileId);
    
    return {
      ...instance,
      companyId: profile?.companyId,
    };
  },
});

export const getProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.providerId);
  },
});

