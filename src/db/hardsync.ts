import drizzleConfig from "../../drizzle-prod.config";
import { type MigrationConfig, readMigrationFiles } from "drizzle-orm/migrator";
import { Pool } from "@neondatabase/serverless";
import { NeonDatabase } from "drizzle-orm/neon-serverless";
import { PgDialect, PgSession } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-serverless";

const config = {
    ...drizzleConfig,
    migrationsFolder: drizzleConfig.out,
    migrationsTable: drizzleConfig.migrations?.table ?? "__drizzle_migrations",
    migrationsSchema: drizzleConfig.migrations?.schema ?? "drizzle",
} as MigrationConfig;

const migrations = readMigrationFiles(config);

const sqlDB = new Pool({ connectionString: process.env.DATABASE_URL });
const connection = drizzle(sqlDB);

const table_name = `${config.migrationsSchema}.${config.migrationsTable}`;

type Schema = typeof connection._.fullSchema;

async function main() {
    const db =
        connection as NeonDatabase<Schema> as unknown as NeonDatabase<Schema> & {
            dialect: PgDialect;
            session: PgSession;
        };

    console.log("~..................¯\\_(ツ)_/¯..................~");
    console.log("Drizzle Migration Hardsync");
    console.log("~...............................................~");
    console.log(
        "If you `drizzle-kit push` you ruin the migration history.\r\nThis script will drop the migration table and create a new one."
    );
    console.log("~...............................................~");
    console.log("~...............................................~");

    console.log("... Dropping Existing Migration Table");
    // Drop the migration table if it exists
    await connection.execute(`DROP TABLE IF EXISTS ${table_name}`);
    console.log("... Existing Migration Table Dropped");

    console.log("... Creating Migration Table");
    // Since we pass no migrations, it only creates the table.
    await db.dialect.migrate([], db.session, {
        migrationsFolder: config.migrationsFolder,
    });
    console.log("... Migration Table Created");
    console.log(`... Inserting ${migrations.length} Migrations`);

    const promises: Promise<void>[] = [];
    for (const migration of migrations) {
        console.log(`... Applying migration ${migration.hash}`);

        // Add migration hashes to migration table
        promises.push(
            connection
                .execute(
                    `INSERT INTO ${table_name} (hash, created_at) VALUES ('${migration.hash}', ${migration.folderMillis})`
                )
                .then(() =>
                    console.log(`... Applied migration ${migration.hash}`)
                )
        );
    }

    await Promise.all(promises);

    console.log("~...............................................~");
    console.log("~.. Migration Hardsync Complete! ˶ᵔ ᵕ ᵔ˶........~");
    console.log("~...............................................~");
}

main().catch(console.error);
