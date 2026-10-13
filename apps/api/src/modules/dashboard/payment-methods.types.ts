import { z } from "zod";
import type { PaymentMethodCode } from "@salesflow/database";

export interface Actor {
  id: string;
  name: string; // User.displayName
  organizationId: string; // organization of the active membership
}

export const DEFAULT_METHOD: Record<PaymentMethodCode, { label: string; icon: string }> = {
  MPESA: { label: "M-PESA", icon: "📱" },
  CASH: { label: "Cash", icon: "💵" },
  BANK: { label: "Bank Transfer", icon: "🏦" },
  CREDIT: { label: "Credit", icon: "💳" },
};

// Whitelist of editable fields. .strict() rejects anything else.
export const updateMethodSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(30).optional(),
  isActive: z.boolean().optional(),
  availableForDistributors: z.boolean().optional(),
  availableForTsm: z.boolean().optional(),
  availableForAsr: z.boolean().optional(),
  supportsStk: z.boolean().optional(),
  supportsB2c: z.boolean().optional(),
  requiresReference: z.boolean().optional(),
  requiresProof: z.boolean().optional(),
  supportsQr: z.boolean().optional(),
}).strict();
export type UpdateMethodInput = z.infer<typeof updateMethodSchema>;

export const moveSchema = z.object({ direction: z.enum(["up", "down"]) });