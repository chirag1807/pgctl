const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const { platform } = require('os');

const execAsync = promisify(exec);

/**
 * Get DATABASE_URL for dbmate
 */
function getPgEnv() {
  return {
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_USER: process.env.PG_USER,
    PG_PASSWORD: process.env.PG_PASSWORD
  };
}

/**
 * Get DATABASE_URL for dbmate
 */
function getDatabaseUrl(dbName) {
  if (!dbName && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!dbName) {
    throw new Error('Database name is required');
  }

  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;
  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT;

  return `postgres://${user}:${password}@${host}:${port}/${dbName}?sslmode=disable`;
}

/**
 * Execute a psql command
 */
async function executePsqlCommand(sql, options = {}) {
  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };
  const dbFlag = options.database ? `-d ${options.database}` : '';

  const command = `psql -P pager=off -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} ${dbFlag} -c "${sql}"`;

  try {
    const { stdout, stderr } = await execAsync(command, { env });
    return { stdout, stderr, success: true };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      success: false
    };
  }
}

/**
 * List all databases
 */
async function listDatabases() {
  console.log(chalk.blue('📋 Listing all databases...\n'));

  const sql = "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;";
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green('✓ Databases:'));
    console.log(result.stdout);
  } else {
    console.log(chalk.red('✗ Error listing databases:'));
    console.log(chalk.red(result.stderr));
  }
}

/**
 * Create a database
 */
async function createDatabase(dbName) {
  console.log(chalk.blue(`➕ Creating database "${dbName}"...\n`));

  const sql = `CREATE DATABASE ${dbName};`;
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ Database "${dbName}" created successfully!`));
  } else {
    if (result.stderr.includes('already exists')) {
      console.log(chalk.yellow(`⚠ Database "${dbName}" already exists.`));
    } else {
      console.log(chalk.red(`✗ Error creating database "${dbName}":`));
      console.log(chalk.red(result.stderr));
    }
  }
}

/**
 * Drop a database
 */
async function dropDatabase(dbName) {
  console.log(chalk.blue(`🗑️  Dropping database "${dbName}"...\n`));

  // First, terminate all connections to the database
  const terminateSql = `
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${dbName}'
    AND pid <> pg_backend_pid();
  `;

  await executePsqlCommand(terminateSql);

  // Now drop the database
  const sql = `DROP DATABASE IF EXISTS ${dbName};`;
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ Database "${dbName}" dropped successfully!`));
  } else {
    console.log(chalk.red(`✗ Error dropping database "${dbName}":`));
    console.log(chalk.red(result.stderr));
  }
}

/**
 * Connect to psql interactively
 */
async function connectToPsql(dbName) {
  console.log(chalk.blue(`🔌 Connecting to psql for database "${dbName}"...`));
  console.log(chalk.gray('(Type \\q or press Ctrl+C to exit psql)\n'));

  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD
  };

  const args = [
    '-h', env.PGHOST,
    '-p', env.PGPORT,
    '-U', env.PGUSER,
    '-d', dbName
  ];

  return new Promise((resolve) => {
    const psqlProcess = spawn('psql', args, {
      env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    psqlProcess.on('error', (error) => {
      console.log(chalk.red('\n✗ Error connecting to psql:'));
      console.log(chalk.red(error.message));
      console.log(chalk.yellow('\nMake sure psql is installed and in your PATH.'));
      resolve();
    });

    psqlProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(chalk.yellow(`\npsql exited with code ${code}`));
      }
      resolve();
    });
  });
}

/**
 * Run dbmate up (apply migrations)
 */
async function runDbmateUp(dbName, migrationsPath = './db/migrations') {
  console.log(chalk.blue(`⬆️  Running dbmate up (applying migrations to "${dbName}")...\n`));

  const databaseUrl = getDatabaseUrl(dbName);
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DBMATE_MIGRATIONS_DIR: migrationsPath
  };

  return new Promise((resolve) => {
    const dbmateProcess = spawn('dbmate', ['up'], {
      env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    dbmateProcess.on('error', (error) => {
      console.log(chalk.red('\n✗ Error running dbmate:'));
      console.log(chalk.red(error.message));
      console.log(chalk.yellow('\nMake sure dbmate is installed and in your PATH.'));
      console.log(chalk.cyan('Install dbmate: https://github.com/amacneil/dbmate#installation'));
      resolve();
    });

    dbmateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Migrations applied successfully!'));
      } else if (code !== null) {
        console.log(chalk.red(`\n✗ dbmate exited with code ${code}`));
      }
      resolve();
    });
  });
}

/**
 * Run dbmate down (rollback migrations)
 */
async function runDbmateDown(dbName, migrationsPath = './db/migrations') {
  console.log(chalk.blue(`⬇️  Running dbmate down (rolling back migrations for "${dbName}")...\n`));

  const databaseUrl = getDatabaseUrl(dbName);
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DBMATE_MIGRATIONS_DIR: migrationsPath
  };

  return new Promise((resolve) => {
    const dbmateProcess = spawn('dbmate', ['down'], {
      env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    dbmateProcess.on('error', (error) => {
      console.log(chalk.red('\n✗ Error running dbmate:'));
      console.log(chalk.red(error.message));
      console.log(chalk.yellow('\nMake sure dbmate is installed and in your PATH.'));
      console.log(chalk.cyan('Install dbmate: https://github.com/amacneil/dbmate#installation'));
      resolve();
    });

    dbmateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Migration rolled back successfully!'));
      } else if (code !== null) {
        console.log(chalk.red(`\n✗ dbmate exited with code ${code}`));
      }
      resolve();
    });
  });
}

/**
 * Run dbmate status (show migration status)
 */
async function runDbmateStatus(dbName, migrationsPath = './db/migrations') {
  console.log(chalk.blue(`📊 Running dbmate status (checking migration status for "${dbName}")...\n`));

  const databaseUrl = getDatabaseUrl(dbName);
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DBMATE_MIGRATIONS_DIR: migrationsPath
  };

  return new Promise((resolve) => {
    const dbmateProcess = spawn('dbmate', ['status'], {
      env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    dbmateProcess.on('error', (error) => {
      console.log(chalk.red('\n✗ Error running dbmate:'));
      console.log(chalk.red(error.message));
      console.log(chalk.yellow('\nMake sure dbmate is installed and in your PATH.'));
      console.log(chalk.cyan('Install dbmate: https://github.com/amacneil/dbmate#installation'));
      resolve();
    });

    dbmateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Status check complete!'));
      } else if (code !== null) {
        console.log(chalk.yellow(`\ndbmate status exited with code ${code}`));
      }
      resolve();
    });
  });
}

/**
 * Clone a database
 */
async function cloneDatabase(sourceDb, targetDb) {
  console.log(chalk.blue(`📋 Cloning database "${sourceDb}" to "${targetDb}"...\n`));

  // First, create the target database
  const createSql = `CREATE DATABASE ${targetDb};`;
  const createResult = await executePsqlCommand(createSql);

  if (!createResult.success && !createResult.stderr.includes('already exists')) {
    console.log(chalk.red(`✗ Error creating target database "${targetDb}":`));
    console.log(chalk.red(createResult.stderr));
    return;
  }

  // Use pg_dump and psql to clone
  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };

  const command = `pg_dump -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} ${sourceDb} | psql -P pager=off -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} ${targetDb}`;

  try {
    await execAsync(command, { env, shell: true });
    console.log(chalk.green(`✓ Database "${sourceDb}" cloned to "${targetDb}" successfully!`));
  } catch (error) {
    console.log(chalk.red(`✗ Error cloning database:`));
    console.log(chalk.red(error.message));
  }
}

/**
 * Reset a database (drop, create, and run migrations)
 */
async function resetDatabase(dbName, migrationsPath = './db/migrations') {
  console.log(chalk.blue(`🔄 Resetting database "${dbName}"...\n`));

  // Drop the database
  await dropDatabase(dbName);

  console.log('');

  // Create the database
  await createDatabase(dbName);

  console.log('');

  // Run migrations
  await runDbmateUp(dbName, migrationsPath);
}

/**
 * Create a new dbmate migration
 */
async function createDbmateMigration(migrationName, migrationsPath = './db/migrations') {
  console.log(chalk.blue(`📝 Creating new migration "${migrationName}"...\n`));

  const env = {
    ...process.env,
    DBMATE_MIGRATIONS_DIR: migrationsPath
  };

  return new Promise((resolve) => {
    const dbmateProcess = spawn('dbmate', ['new', migrationName], {
      env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    dbmateProcess.on('error', (error) => {
      console.log(chalk.red('\n✗ Error running dbmate:'));
      console.log(chalk.red(error.message));
      console.log(chalk.yellow('\nMake sure dbmate is installed and in your PATH.'));
      console.log(chalk.cyan('Install dbmate: https://github.com/amacneil/dbmate#installation'));
      resolve();
    });

    dbmateProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Migration file created successfully!'));
      } else if (code !== null) {
        console.log(chalk.red(`\n✗ dbmate exited with code ${code}`));
      }
      resolve();
    });
  });
}

/**
 * Backup a database using pg_dump
 */
async function backupDatabase(dbName, backupPath) {
  console.log(chalk.blue(`💾 Backing up database "${dbName}" to "${backupPath}"...\n`));

  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };

  // Ensure directory exists
  const pathModule = require('path');
  const fs = require('fs');
  const dir = pathModule.dirname(backupPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Determine format by extension
  const fileExt = pathModule.extname(backupPath).toLowerCase();
  let command;

  // Custom format (.dump, .backup, .dmp) uses -Fc (compressed custom format)
  // Plain SQL format (.sql) uses default format
  if (fileExt === '.dump' || fileExt === '.backup' || fileExt === '.dmp') {
    console.log(chalk.cyan('Creating custom format backup (compressed)...\n'));
    command = `pg_dump -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} -Fc -f "${backupPath}" ${dbName}`;
  } else {
    // Default to plain SQL format
    console.log(chalk.cyan('Creating plain SQL format backup...\n'));
    command = `pg_dump -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} ${dbName} > "${backupPath}"`;
  }

  try {
    await execAsync(command, { env, shell: true });
    console.log(chalk.green(`✓ Database "${dbName}" backed up successfully to "${backupPath}"!`));
  } catch (error) {
    console.log(chalk.red(`✗ Error backing up database:`));
    console.log(chalk.red(error.message));
  }
}

/**
 * Restore a database from backup
 */
async function restoreDatabase(dbName, backupPath) {
  console.log(chalk.blue(`♻️  Restoring database "${dbName}" from "${backupPath}"...\n`));

  const fs = require('fs');
  const pathModule = require('path');

  // Check if file exists
  if (!fs.existsSync(backupPath)) {
    console.log(chalk.red(`✗ Backup file "${backupPath}" not found!`));
    return;
  }

  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };

  // Determine file format by extension
  const fileExt = pathModule.extname(backupPath).toLowerCase();
  let command;
  let usePgRestore = false;

  // Custom format (.dump, .backup, .dmp) requires pg_restore
  // Plain SQL format (.sql) uses psql
  if (fileExt === '.dump' || fileExt === '.backup' || fileExt === '.dmp') {
    usePgRestore = true;
    console.log(chalk.cyan('Detected custom format backup, using pg_restore...\n'));
    command = `pg_restore -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} -d ${dbName} --clean --if-exists --no-owner --no-acl "${backupPath}"`;
  } else {
    // Default to psql for .sql or unknown extensions
    console.log(chalk.cyan('Detected plain SQL format, using psql...\n'));
    command = `psql -P pager=off -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} -d ${dbName} < "${backupPath}"`;
  }

  try {
    await execAsync(command, { env, shell: true });
    console.log(chalk.green(`✓ Database "${dbName}" restored successfully from "${backupPath}"!`));
  } catch (error) {
    console.log(chalk.red(`✗ Error restoring database:`));
    console.log(chalk.red(error.stderr || error.message));
    
    if (usePgRestore && error.message.includes('pg_restore')) {
      console.log(chalk.yellow('\nMake sure pg_restore is installed and in your PATH.'));
    }
  }
}

/**
 * Execute SQL file with transaction
 */
async function executeSqlFile(dbName, sqlFilePath) {
  console.log(chalk.blue(`⚡ Executing SQL file "${sqlFilePath}" on database "${dbName}"...\n`));

  const fs = require('fs');

  // Check if file exists
  if (!fs.existsSync(sqlFilePath)) {
    console.log(chalk.red(`✗ SQL file "${sqlFilePath}" not found!`));
    return;
  }

  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };

  // Use psql to execute the file with transaction and error handling
  const command = `psql -P pager=off -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} -d ${dbName} -v ON_ERROR_STOP=1 -f "${sqlFilePath}"`;

  try {
    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr && !stderr.includes('COMMIT')) {
      console.log(chalk.yellow('Warnings:'));
      console.log(stderr);
    }

    console.log(chalk.green(`✓ SQL file executed successfully!`));
    if (stdout) {
      console.log(stdout);
    }
  } catch (error) {
    console.log(chalk.red(`✗ Error executing SQL file:`));
    console.log(chalk.red(error.stderr || error.message));
  }
}

/**
 * List all tables in a database
 */
async function listTables(dbName) {
  console.log(chalk.blue(`📋 Listing tables in database "${dbName}"...\n`));

  const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;";

  const result = await executePsqlCommand(sql, { database: dbName });

  if (result.success) {
    console.log(chalk.green('✓ Tables:'));
    console.log(result.stdout);
  } else {
    console.log(chalk.red('✗ Error listing tables:'));
    console.log(chalk.red(result.stderr));
  }
}

/**
 * Export database schema (DDL only)
 */
async function exportSchema(dbName, exportPath) {
  console.log(chalk.blue(`📤 Exporting schema for database "${dbName}" to "${exportPath}"...\n`));

  const env = {
    ...process.env,
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD,
  };

  // Ensure directory exists
  const pathModule = require('path');
  const fs = require('fs');
  const dir = pathModule.dirname(exportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const command = `pg_dump -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} --schema-only ${dbName} > "${exportPath}"`;

  try {
    await execAsync(command, { env, shell: true });
    console.log(chalk.green(`✓ Schema exported successfully to "${exportPath}"!`));
  } catch (error) {
    console.log(chalk.red(`✗ Error exporting schema:`));
    console.log(chalk.red(error.message));
  }
}

/**
 * List all users/roles
 */
async function listUsers() {
  console.log(chalk.blue('👥 Listing PostgreSQL users/roles...\n'));

  const sql = "SELECT rolname as username, rolsuper as is_superuser, rolcreatedb as can_create_db, rolcreaterole as can_create_role FROM pg_roles WHERE rolname NOT LIKE 'pg_%' ORDER BY rolname;";

  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green('✓ Users/Roles:'));
    console.log(result.stdout);
  } else {
    console.log(chalk.red('✗ Error listing users:'));
    console.log(chalk.red(result.stderr));
  }
}

/**
 * Create a new user with password
 */
async function createUser(username, password) {
  console.log(chalk.blue(`👤 Creating user "${username}"...\n`));

  const sql = `CREATE USER ${username} WITH PASSWORD '${password}';`;
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ User "${username}" created successfully!`));
  } else {
    if (result.stderr.includes('already exists')) {
      console.log(chalk.yellow(`⚠ User "${username}" already exists.`));
    } else {
      console.log(chalk.red(`✗ Error creating user "${username}":`));
      console.log(chalk.red(result.stderr));
    }
  }
}

/**
 * Create a new role
 */
async function createRole(roleName, options = {}) {
  console.log(chalk.blue(`🎭 Creating role "${roleName}"...\n`));

  let sqlOptions = [];
  if (options.canLogin) sqlOptions.push('LOGIN');
  if (options.canCreateDb) sqlOptions.push('CREATEDB');
  if (options.canCreateRole) sqlOptions.push('CREATEROLE');
  if (options.isSuperuser) sqlOptions.push('SUPERUSER');

  const optionsStr = sqlOptions.length > 0 ? ` WITH ${sqlOptions.join(' ')}` : '';
  const sql = `CREATE ROLE ${roleName}${optionsStr};`;

  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ Role "${roleName}" created successfully!`));
  } else {
    if (result.stderr.includes('already exists')) {
      console.log(chalk.yellow(`⚠ Role "${roleName}" already exists.`));
    } else {
      console.log(chalk.red(`✗ Error creating role "${roleName}":`));
      console.log(chalk.red(result.stderr));
    }
  }
}

/**
 * Grant permissions to a user on a database
 */
async function grantPermissions(dbName, username) {
  console.log(chalk.blue(`🔓 Granting permissions to user "${username}" on database "${dbName}"...\n`));

  const sql = `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username};`;
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ Permissions granted successfully!`));
  } else {
    console.log(chalk.red(`✗ Error granting permissions:`));
    console.log(chalk.red(result.stderr));
  }
}

/**
 * Revoke permissions from a user on a database
 */
async function revokePermissions(dbName, username) {
  console.log(chalk.blue(`🔒 Revoking permissions from user "${username}" on database "${dbName}"...\n`));

  const sql = `REVOKE ALL PRIVILEGES ON DATABASE ${dbName} FROM ${username};`;
  const result = await executePsqlCommand(sql);

  if (result.success) {
    console.log(chalk.green(`✓ Permissions revoked successfully!`));
  } else {
    console.log(chalk.red(`✗ Error revoking permissions:`));
    console.log(chalk.red(result.stderr));
  }
}

module.exports = {
  listDatabases,
  createDatabase,
  dropDatabase,
  cloneDatabase,
  resetDatabase,
  connectToPsql,
  executeSqlFile,
  listTables,
  exportSchema,
  runDbmateUp,
  runDbmateDown,
  runDbmateStatus,
  createDbmateMigration,
  backupDatabase,
  restoreDatabase,
  listUsers,
  createUser,
  createRole,
  grantPermissions,
  revokePermissions
};
