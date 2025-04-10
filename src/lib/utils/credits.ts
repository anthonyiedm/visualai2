import { Plan } from '@prisma/client';
import prisma from '../prisma';

// Credits allocated per plan
const PLAN_CREDITS = {
  FREE: 50,
  BASIC: 2500,
  STANDARD: 10000,
  PRO: 50000
};

/**
 * Check if a shop has enough credits for an operation
 */
export async function hasEnoughCredits(shopId: string, requiredCredits: number): Promise<boolean> {
  const credits = await prisma.credits.findUnique({
    where: { shopId }
  });

  if (!credits) {
    return false;
  }

  return credits.available >= requiredCredits;
}

/**
 * Use credits for an operation
 * Returns the number of credits actually used
 */
export async function useCredits(shopId: string, amount: number): Promise<number> {
  // Ensure we don't use more credits than available
  const credits = await prisma.credits.findUnique({
    where: { shopId }
  });

  if (!credits) {
    throw new Error(`No credits found for shop ${shopId}`);
  }

  const creditsToUse = Math.min(amount, credits.available);

  if (creditsToUse <= 0) {
    return 0;
  }

  await prisma.credits.update({
    where: { shopId },
    data: {
      available: { decrement: creditsToUse }
    }
  });

  return creditsToUse;
}

/**
 * Add credits to a shop
 */
export async function addCredits(shopId: string, amount: number): Promise<void> {
  await prisma.credits.update({
    where: { shopId },
    data: {
      available: { increment: amount },
      total: { increment: amount },
      lastPurchased: new Date()
    }
  });
}

/**
 * Reset credits based on plan
 */
export async function resetCredits(shopId: string): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId }
  });

  if (!shop) {
    throw new Error(`Shop ${shopId} not found`);
  }

  const planCredits = PLAN_CREDITS[shop.plan as keyof typeof PLAN_CREDITS] || PLAN_CREDITS.FREE;
  
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);

  await prisma.credits.update({
    where: { shopId },
    data: {
      available: planCredits,
      total: planCredits,
      resetDate: nextResetDate
    }
  });
}

/**
 * Initialize credits for a new shop
 */
export async function initializeCredits(shopId: string, plan: Plan = Plan.FREE): Promise<void> {
  const planCredits = PLAN_CREDITS[plan] || PLAN_CREDITS.FREE;
  
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);

  await prisma.credits.create({
    data: {
      shopId,
      available: planCredits,
      total: planCredits,
      resetDate,
      lastPurchased: new Date()
    }
  });
}

/**
 * Update shop plan and adjust credits accordingly
 */
export async function updatePlan(shopId: string, newPlan: Plan): Promise<void> {
  await prisma.shop.update({
    where: { id: shopId },
    data: { plan: newPlan }
  });

  // Reset credits based on new plan
  await resetCredits(shopId);
}

/**
 * Get credits info for a shop
 * Includes days until reset and a calculation of usage trend
 */
export async function getCreditsInfo(shopId: string): Promise<any> {
  const credits = await prisma.credits.findUnique({
    where: { shopId }
  });

  if (!credits) {
    throw new Error(`No credits found for shop ${shopId}`);
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId }
  });

  if (!shop) {
    throw new Error(`Shop ${shopId} not found`);
  }

  // Calculate days until reset
  const now = new Date();
  const daysUntilReset = Math.max(
    0,
    Math.ceil((credits.resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate usage trend (% used in the last 7 days)
  const lastWeekHistory = await prisma.generationHistory.findMany({
    where: {
      shopId,
      createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    }
  });

  const lastWeekCreditsUsed = lastWeekHistory.reduce((total, history) => total + history.creditsUsed, 0);
  const planCredits = PLAN_CREDITS[shop.plan as keyof typeof PLAN_CREDITS] || PLAN_CREDITS.FREE;
  const usageTrend = Math.round((lastWeekCreditsUsed / planCredits) * 100);

  return {
    available: credits.available,
    total: credits.total,
    daysUntilReset,
    usageTrend,
    plan: shop.plan
  };
}