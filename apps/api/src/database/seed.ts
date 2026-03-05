import { db } from "./index";
import { organization } from "./schema/auth";
import { eq } from "drizzle-orm";

const VERICHAN_ORG_SLUG = "verichan";

async function seed() {
  console.log("Seeding database...");

  // Check if verichan org exists
  const existing = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, VERICHAN_ORG_SLUG))
    .limit(1);

  if (existing.length > 0) {
    console.log("Verichan organization already exists, skipping seed.");
    return;
  }

  // Create the verichan organization
  await db.insert(organization).values({
    id: crypto.randomUUID(),
    name: "Verichan",
    slug: VERICHAN_ORG_SLUG,
    metadata: JSON.stringify({ internal: true }),
  });

  console.log("Created internal 'verichan' organization.");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Create an admin user via magic link sign-in");
  console.log("  2. Add the admin as a member of the verichan org");
  console.log("  3. Invite reviewers via the organization invitation API");

  console.log("");
  console.log("Seed complete.");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
