import type { Company } from "@prisma/client";

type CompanyCompletenessFields = Pick<
  Company,
  "name" | "tagline" | "description" | "valueProp"
>;

export function isCompanyComplete(company: CompanyCompletenessFields): boolean {
  return Boolean(
    company.name?.trim() &&
      company.tagline?.trim() &&
      company.description?.trim() &&
      company.valueProp?.trim(),
  );
}
