import { prisma } from "./db";

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.missingPersonCase.count({ where: { caseNumber: { startsWith: `BD-MP-${year}-` } } });
  const next = (count + 1).toString().padStart(6, "0");
  return `BD-MP-${year}-${next}`;
}
