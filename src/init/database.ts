import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#generated/prisma";
import { DATABASE_URL } from "../utils/env";

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
