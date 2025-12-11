import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma";
import { DATABASE_URL } from "./src/utils/env";
import pg from "pg";

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function diagnose() {
  console.log("=== Diagnosing Rank Issue ===\n");

  try {
    // Test 1: Simple findUnique query
    console.log("Test 1: Simple findUnique query...");
    const testUser = await prisma.level.findUnique({
      where: {
        guildId_userId: {
          guildId: "1388298758537744605",
          userId: "225176015016558593",
        },
      },
    });
    console.log("✓ findUnique succeeded");
    console.log("Result:", testUser);
    console.log();

    // Test 2: Check if the levels table exists and has the rank column
    console.log("Test 2: Checking table schema...");
    const pool = new pg.Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    const schemaQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'levels'
      ORDER BY ordinal_position;
    `;
    const schemaResult = await client.query(schemaQuery);
    console.log("✓ Table columns:");
    schemaResult.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || "none"})`);
    });
    console.log();

    // Test 3: Check for views that might use rank()
    console.log("Test 3: Checking for views...");
    const viewsQuery = `
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE '%level%';
    `;
    const viewsResult = await client.query(viewsQuery);
    if (viewsResult.rows.length > 0) {
      console.log("⚠ Found views:");
      viewsResult.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
        console.log(`    Definition: ${row.view_definition}`);
      });
    } else {
      console.log("✓ No views found");
    }
    console.log();

    // Test 4: Check for triggers
    console.log("Test 4: Checking for triggers...");
    const triggersQuery = `
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'levels';
    `;
    const triggersResult = await client.query(triggersQuery);
    if (triggersResult.rows.length > 0) {
      console.log("⚠ Found triggers:");
      triggersResult.rows.forEach((row) => {
        console.log(`  - ${row.trigger_name} (${row.event_manipulation})`);
        console.log(`    Action: ${row.action_statement}`);
      });
    } else {
      console.log("✓ No triggers found");
    }
    console.log();

    // Test 5: Check for functions that might use rank()
    console.log("Test 5: Checking for functions with 'rank'...");
    const functionsQuery = `
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND (routine_name LIKE '%rank%' OR routine_definition LIKE '%rank%');
    `;
    const functionsResult = await client.query(functionsQuery);
    if (functionsResult.rows.length > 0) {
      console.log("⚠ Found functions:");
      functionsResult.rows.forEach((row) => {
        console.log(`  - ${row.routine_name}`);
        console.log(`    Definition: ${row.routine_definition}`);
      });
    } else {
      console.log("✓ No functions found");
    }
    console.log();

    // Test 6: Try to manually query with rank
    console.log("Test 6: Testing manual query with rank field...");
    const manualQuery = `
      SELECT "id", "guildId", "userId", "level", "xpTotal", "rank"
      FROM "levels"
      WHERE "guildId" = $1 AND "userId" = $2
      LIMIT 1;
    `;
    const manualResult = await client.query(manualQuery, ["1388298758537744605", "225176015016558593"]);
    console.log("✓ Manual query succeeded");
    console.log("Result:", manualResult.rows[0]);
    console.log();

    // Test 7: Check for constraints
    console.log("Test 7: Checking for constraints...");
    const constraintsQuery = `
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'levels'::regclass;
    `;
    const constraintsResult = await client.query(constraintsQuery);
    if (constraintsResult.rows.length > 0) {
      console.log("Constraints found:");
      constraintsResult.rows.forEach((row) => {
        console.log(`  - ${row.conname} (${row.contype}): ${row.definition}`);
      });
    } else {
      console.log("✓ No special constraints found");
    }

    client.release();
    await pool.end();

    console.log("\n=== Diagnosis Complete ===");
  } catch (error) {
    console.error("❌ Error during diagnosis:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
