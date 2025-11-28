#!/usr/bin/env node

const dotenv = require('dotenv');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const {
  listDatabases,
  createDatabase,
  dropDatabase,
  connectToPsql,
  runDbmateUp,
  runDbmateDown,
  runDbmateStatus
} = require('./lib/db-operations');

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(chalk.green('✓ Loaded .env file'));
} else {
  console.log(chalk.yellow('⚠ No .env file found. Using environment variables.'));
}

// Validate required environment variables
const requiredEnvVars = ['PG_HOST', 'PG_USER', 'PG_PASSWORD', 'PG_PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log(chalk.red('✗ Missing required environment variables:'));
  missingVars.forEach(varName => {
    console.log(chalk.red(`  - ${varName}`));
  });
  console.log(chalk.yellow('\nPlease create a .env file or set these environment variables.'));
  console.log(chalk.cyan('Example .env file:'));
  console.log(chalk.gray(`
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=yourpassword
PG_PORT=5432
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/your_database?sslmode=disable
  `));
  process.exit(1);
}

// Display current configuration
console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold('  PostgreSQL Database Operations CLI'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

console.log(chalk.bold.white('📡 Current Configuration:\n'));
console.log(`  ${chalk.dim('Host:')}     ${chalk.green(process.env.PG_HOST)}`);
console.log(`  ${chalk.dim('Port:')}     ${chalk.green(process.env.PG_PORT)}`);
console.log(`  ${chalk.dim('User:')}     ${chalk.green(process.env.PG_USER)}`);
console.log(`  ${chalk.dim('Password:')} ${chalk.green('•'.repeat(process.env.PG_PASSWORD.length))}\n`);

// Menu options
const menuChoices = [
  { name: '1) List all databases', value: 'list' },
  { name: '2) Create a database', value: 'create' },
  { name: '3) Drop a database', value: 'drop' },
  { name: '4) Connect to psql', value: 'psql' },
  { name: '5) Run dbmate up (apply migrations)', value: 'dbmate-up' },
  { name: '6) Run dbmate down (rollback migrations)', value: 'dbmate-down' },
  { name: '7) Run dbmate status (show migration status)', value: 'dbmate-status' },
  { name: '8) Exit', value: 'exit' }
];

async function showMenu() {
  console.log(chalk.dim('📋 Navigation: ↑/↓ Arrow keys, Enter to select, Ctrl+C to exit\n'));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: menuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  switch (action) {
    case 'list':
      await listDatabases();
      break;

    case 'create':
      const { dbName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbName',
          message: 'Enter database name to create:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            if (!/^[a-zA-Z0-9_]+$/.test(input)) {
              return 'Database name can only contain letters, numbers, and underscores';
            }
            return true;
          }
        }
      ]);
      await createDatabase(dbName.trim());
      break;

    case 'drop':
      const { dbNameDrop } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameDrop',
          message: 'Enter database name to drop:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            return true;
          }
        }
      ]);

      const { confirmDrop } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDrop',
          message: chalk.red(`Are you sure you want to drop database "${dbNameDrop}"? This cannot be undone!`),
          default: false
        }
      ]);

      if (confirmDrop) {
        await dropDatabase(dbNameDrop.trim());
      } else {
        console.log(chalk.yellow('Operation cancelled.'));
      }
      break;

    case 'psql':
      const { dbNamePsql } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNamePsql',
          message: 'Enter database name to connect:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            return true;
          }
        }
      ]);
      await connectToPsql(dbNamePsql.trim());
      break;

    case 'dbmate-up':
      const { dbNameUp } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameUp',
          message: 'Enter database name for migrations:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            return true;
          }
        }
      ]);
      await runDbmateUp(dbNameUp.trim());
      break;

    case 'dbmate-down':
      const { dbNameDown } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameDown',
          message: 'Enter database name for rollback:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            return true;
          }
        }
      ]);
      await runDbmateDown(dbNameDown.trim());
      break;

    case 'dbmate-status':
      const { dbNameStatus } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameStatus',
          message: 'Enter database name to check status:',
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            return true;
          }
        }
      ]);
      await runDbmateStatus(dbNameStatus.trim());
      break;

    case 'exit':
      console.log(chalk.cyan('👋 Goodbye!\n'));
      process.exit(0);
      break;

    default:
      console.log(chalk.red('Unknown action'));
  }

  console.log('');
  
  // Ask if user wants to continue
  const { continueAction } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueAction',
      message: 'Would you like to perform another operation?',
      default: true
    }
  ]);

  if (continueAction) {
    console.log('');
    await showMenu();
  } else {
    console.log(chalk.cyan('\n👋 Goodbye!\n'));
    process.exit(0);
  }
}

// Start the CLI
async function main() {
  try {
    await showMenu();
  } catch (error) {
    if (error.isTtyError) {
      console.log(chalk.red('Prompt couldn\'t be rendered in the current environment'));
    } else if (error.message && error.message.includes('User force closed')) {
      console.log(chalk.yellow('\n\nOperation cancelled by user.'));
      process.exit(0);
    } else {
      console.log(chalk.red('An error occurred:'), error.message);
    }
    process.exit(1);
  }
}

main();
