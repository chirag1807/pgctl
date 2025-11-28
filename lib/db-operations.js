const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const { platform } = require('os');

const execAsync = promisify(exec);

/**
 * Get PostgreSQL connection parameters from environment
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
    PGHOST: process.env.PG_HOST,
    PGPORT: process.env.PG_PORT,
    PGUSER: process.env.PG_USER,
    PGPASSWORD: process.env.PG_PASSWORD
  };
  const dbFlag = options.database ? `-d ${options.database}` : '';
  
  // Use -t for tuple-only mode, -A for unaligned output
  const command = `psql -h ${env.PGHOST} -p ${env.PGPORT} -U ${env.PGUSER} ${dbFlag} -c "${sql}"`;
  
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
async function runDbmateUp(dbName) {
  console.log(chalk.blue(`⬆️  Running dbmate up (applying migrations to "${dbName}")...\n`));
  
  const databaseUrl = getDatabaseUrl(dbName);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  
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
async function runDbmateDown(dbName) {
  console.log(chalk.blue(`⬇️  Running dbmate down (rolling back migrations for "${dbName}")...\n`));
  
  const databaseUrl = getDatabaseUrl(dbName);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  
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
async function runDbmateStatus(dbName) {
  console.log(chalk.blue(`📊 Running dbmate status (checking migration status for "${dbName}")...\n`));
  
  const databaseUrl = getDatabaseUrl(dbName);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  
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

module.exports = {
  listDatabases,
  createDatabase,
  dropDatabase,
  connectToPsql,
  runDbmateUp,
  runDbmateDown,
  runDbmateStatus
};
