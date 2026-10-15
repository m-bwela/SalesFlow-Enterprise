export const PAYMENT_CODES = ["MPESA", "CASH", "BANK", "CREDIT"] as const;
export type PaymentMethodCode = (typeof PAYMENT_CODES)[number];

// Editable per-method flags: column name -> table header. Order here is the column order.
export const FLAGS = {
  availableForDistributors: "DISTRIBUTORS",
  availableForTsm: "TSM",
  availableForAsr: "ASR/MTSR",
  supportsStk: "STK",
  supportsB2c: "B2C",
  requiresReference: "REF",
  requiresProof: "PROOF",
  supportsQr: "QR",
} as const;
export type FlagKey = keyof typeof FLAGS;
export const FLAG_KEYS = Object.keys(FLAGS) as FlagKey[];

export type PaymentMethodDTO = {
  id: string;
  code: PaymentMethodCode;
  label: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
} & Record<FlagKey, boolean>;

export interface AuditDTO {
  id: string;
  methodCode: PaymentMethodCode;
  action: string;
  detail: string;
  actorName: string | null;
  createdAt: string;
}