import type { CompanySummary } from "@/features/demo/pulseops-demo-data";

export type CompanyLinkIndex = Map<string, string>;

export function buildCompanyLinkIndex(
  companies: Pick<CompanySummary, "id" | "name">[],
): CompanyLinkIndex {
  const index: CompanyLinkIndex = new Map();

  for (const company of companies) {
    const name = normalizeCompanyName(company.name);

    if (name) {
      index.set(name, `/app/companies/${encodeURIComponent(company.id)}`);
    }
  }

  return index;
}

export function getCompanyHref(
  companyLinkIndex: CompanyLinkIndex,
  companyName: string,
) {
  return companyLinkIndex.get(normalizeCompanyName(companyName)) ?? null;
}

export function normalizeCompanyName(value: string) {
  return value.trim().toLowerCase();
}
