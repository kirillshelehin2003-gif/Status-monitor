import { spawnSync } from "node:child_process";
import { prisma } from "../src/server/database/prisma";

async function main() {
  const count = await prisma.service.count();

  if (count > 0) {
    console.log(`Database already has ${count} services. Skipping seed.`);
    return;
  }

  console.log("Database is empty. Running seed...");
  const result = spawnSync("npm", ["run", "db:seed"], {
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`Seed failed with exit code ${result.status ?? "unknown"}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
