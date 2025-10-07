/**
 * SYNC MUTATIONS
 * Mutation helper per sync engine
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateCursor = mutation({
  args: {
    instanceId: v.id("integrationInstances"),
    cursor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      lastModifiedCursor: args.cursor,
      updatedAt: Date.now(),
    });
  },
});

export const updateLastSync = mutation({
  args: {
    instanceId: v.id("integrationInstances"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      lastSyncAt: args.timestamp,
      updatedAt: args.timestamp,
    });
  },
});

