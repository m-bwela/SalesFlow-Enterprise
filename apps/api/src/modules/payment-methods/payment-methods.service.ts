import nodemailer from "nodemailer";
import { Prisma, prisma, type PaymentMethodCode } from "@salesflow/database";
import { FLAGS, FLAG_KEYS } from "./payment-methods.js"
import { DEFAULT_METHOD, type Actor, type UpdateMethodInput } from "../payment-methods/payment-methods.types.js"

// TODO: swap for the error class in apps/api/src/errors if you have an equivalent.
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

type Db = Prisma.TransactionClient | typeof prisma;
type Entry = { methodCode: PaymentMethodCode; action: string; detail: string };
type Log = (code: PaymentMethodCode, action: string, detail: string) => void;

// ── Audit + notification ────────────────────────────────────────────────────

// Admin / CFO / Finance users of the organization via Membership -> MembershipRole -> Role.
// Relation names (membership, role, user) are guesses from your seed; match them to schema.prisma.
async function resolveRecipients(organizationId: string): Promise<string[]> {
  const grants = await prisma.membershipRole.findMany({
    where: {
      isActive: true,
      role: { code: { in: ["ADMIN", "CFO", "FINANCE"] } },
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      membership: { organizationId, isActive: true, user: { status: "ACTIVE" } },
    },
    select: { membership: { select: { user: { select: { email: true } } } } },
  });
  return [...new Set(grants.map(g => g.membership.user.email).filter((e): e is string => !!e))];
}

async function notify(actor: Actor, entries: Entry[]): Promise<void> {
  try {
    if (!entries.length) return;
    const to = await resolveRecipients(actor.organizationId);
    if (!to.length) return;
    await mailer.sendMail({
      from: process.env.MAIL_FROM, to,
      subject: `Payment methods changed: ${[...new Set(entries.map(e => e.methodCode))].join(", ")}`,
      text: entries.map(e => `${e.methodCode}: ${e.detail}`).join("\n") + `\n\nChanged by ${actor.name} at ${new Date().toISOString()}`,
    });
  } catch (err) { console.error("Audit email failed", err); } // never fail the request over email
}

// One transaction: the change and its audit rows commit together. The email goes out only after commit.
async function audited(actor: Actor, fn: (tx: Prisma.TransactionClient, log: Log) => Promise<void>): Promise<void> {
  const entries: Entry[] = [];
  const log: Log = (methodCode, action, detail) => { entries.push({ methodCode, action, detail }); };
  await prisma.$transaction(async tx => {
    await fn(tx, log);
    if (entries.length)
      await tx.paymentMethodAudit.createMany({
        data: entries.map(e => ({ ...e, organizationId: actor.organizationId, actorId: actor.id, actorName: actor.name })),
      });
  });
  void notify(actor, entries);
}

// ── Queries ─────────────────────────────────────────────────────────────────

const list = (db: Db, organizationId: string) =>
  db.paymentMethod.findMany({ where: { organizationId }, orderBy: { sortOrder: "asc" } });

export const listMethods = (organizationId: string) => list(prisma, organizationId);

export const listAudit = (organizationId: string, code?: PaymentMethodCode) =>
  prisma.paymentMethodAudit.findMany({
    where: { organizationId, ...(code && { methodCode: code }) },
    orderBy: { createdAt: "desc" }, take: 100,
  });

// Renumber 1..n so sortOrder never has gaps.
async function renumber(tx: Prisma.TransactionClient, ids: string[]) {
  for (const [n, id] of ids.entries()) await tx.paymentMethod.update({ where: { id }, data: { sortOrder: n + 1 } });
}

// ── Commands (each returns the fresh list) ─────────────────────────────────

export async function addMethod(actor: Actor, code: PaymentMethodCode) {
  await audited(actor, async (tx, log) => {
    const last = await tx.paymentMethod.aggregate({ where: { organizationId: actor.organizationId }, _max: { sortOrder: true } });
    await tx.paymentMethod.create({
      data: { organizationId: actor.organizationId, code, ...DEFAULT_METHOD[code], sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
    log(code, "created", "was added");
  });
  return listMethods(actor.organizationId);
}

// Only real changes are written and audited.
export async function updateMethod(actor: Actor, code: PaymentMethodCode, input: UpdateMethodInput) {
  await audited(actor, async (tx, log) => {
    const cur = await tx.paymentMethod.findUnique({
      where: { organizationId_code: { organizationId: actor.organizationId, code } },
    });
    if (!cur) throw new HttpError(404, "Not found");
    const data: Prisma.PaymentMethodUpdateInput = {};
    if (input.label !== undefined && input.label !== cur.label) {
      data.label = input.label;
      log(code, "label", `label changed from "${cur.label}" to "${input.label}"`);
    }
    if (input.isActive !== undefined && input.isActive !== cur.isActive) {
      data.isActive = input.isActive;
      log(code, "active", input.isActive ? "was activated" : "was deactivated");
    }
    for (const key of FLAG_KEYS) {
      const next = input[key];
      if (next !== undefined && next !== cur[key]) {
        Object.assign(data, { [key]: next });
        log(code, "flag", `${next ? "enabled" : "disabled"} for ${FLAGS[key]}`);
      }
    }
    if (Object.keys(data).length) await tx.paymentMethod.update({ where: { id: cur.id }, data });
  });
  return listMethods(actor.organizationId);
}

export async function moveMethod(actor: Actor, code: PaymentMethodCode, direction: "up" | "down") {
  await audited(actor, async (tx, log) => {
    const rows = await list(tx, actor.organizationId);
    const i = rows.findIndex(r => r.code === code), j = i + (direction === "up" ? -1 : 1);
    if (i < 0) throw new HttpError(404, "Not found");
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
    await renumber(tx, rows.map(r => r.id));
    log(code, "reorder", `moved to position ${j + 1}`);
  });
  return listMethods(actor.organizationId);
}

export async function deleteMethod(actor: Actor, code: PaymentMethodCode) {
  await audited(actor, async (tx, log) => {
    const { count } = await tx.paymentMethod.deleteMany({ where: { organizationId: actor.organizationId, code } });
    if (!count) throw new HttpError(404, "Not found");
    await renumber(tx, (await list(tx, actor.organizationId)).map(r => r.id));
    log(code, "deleted", "was deleted");
  });
  return listMethods(actor.organizationId);
}