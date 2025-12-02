const inquirer = require('inquirer');
const chalk = require('chalk');
const {
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
} = require('./db-operations');
const { loadConfig, displayConfig } = require('./config');

// Load and validate configuration
loadConfig();

// Display current configuration
displayConfig();

// Context storage for remembering user inputs within a session
const context = {
  lastDbName: '',
  lastMigrationsPath: './db/migrations'
};

// Main menu categories
const mainMenuChoices = [
  { name: '1) 🗄️ Database Operations', value: 'database' },
  { name: '2) 🔄 Migrations (dbmate)', value: 'migrations' },
  { name: '3) 💾 Backup & Restore', value: 'backup' },
  { name: '4) ⚡ SQL Operations', value: 'sql' },
  { name: '5) 👥 Users & Permissions', value: 'users' },
  { name: '6) ❌ Exit', value: 'exit' }
];

// Submenu choices
const databaseMenuChoices = [
  { name: '1) List all databases', value: 'list' },
  { name: '2) Create database', value: 'create' },
  { name: '3) Drop database', value: 'drop' },
  { name: '4) Clone database', value: 'clone' },
  { name: '5) Reset database (drop → create → migrate)', value: 'reset' },
  { name: '6) ← Back to main menu', value: 'back' }
];

const migrationsMenuChoices = [
  { name: '1) Create new migration', value: 'create' },
  { name: '2) Apply migrations (up)', value: 'up' },
  { name: '3) Rollback migration (down)', value: 'down' },
  { name: '4) Migration status', value: 'status' },
  { name: '5) ← Back to main menu', value: 'back' }
];

const backupMenuChoices = [
  { name: '1) Backup database', value: 'backup' },
  { name: '2) Restore database', value: 'restore' },
  { name: '3) ← Back to main menu', value: 'back' }
];

const sqlMenuChoices = [
  { name: '1) Connect to psql', value: 'psql' },
  { name: '2) Execute SQL file', value: 'exec' },
  { name: '3) List tables in database', value: 'tables' },
  { name: '4) Export schema', value: 'export' },
  { name: '5) ← Back to main menu', value: 'back' }
];

const usersMenuChoices = [
  { name: '1) List users/roles', value: 'list' },
  { name: '2) Create user', value: 'create-user' },
  { name: '3) Create role', value: 'create-role' },
  { name: '4) Grant permissions', value: 'grant' },
  { name: '5) Revoke permissions', value: 'revoke' },
  { name: '6) ← Back to main menu', value: 'back' }
];

// Main menu function
async function showMainMenu() {
  console.log(chalk.dim('📋 Navigation: ↑/↓ Arrow keys, Enter to select, Ctrl+C to exit\n'));
  
  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'Select a category:',
      choices: mainMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  switch (category) {
    case 'database':
      await showDatabaseMenu();
      break;
    case 'migrations':
      await showMigrationsMenu();
      break;
    case 'backup':
      await showBackupMenu();
      break;
    case 'sql':
      await showSqlMenu();
      break;
    case 'users':
      await showUsersMenu();
      break;
    case 'exit':
      console.log(chalk.cyan('👋 Goodbye!\n'));
      process.exit(0);
      break;
  }
}

// Database Operations Menu
async function showDatabaseMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Database Operations:',
      choices: databaseMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  if (action === 'back') {
    await showMainMenu();
    return;
  }

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

    case 'clone':
      const { sourceDb } = await inquirer.prompt([
        {
          type: 'input',
          name: 'sourceDb',
          message: 'Enter source database name:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      
      // Generate default target name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultTargetDb = `${sourceDb.trim()}_clone_${timestamp}`;
      
      const { targetDb } = await inquirer.prompt([
        {
          type: 'input',
          name: 'targetDb',
          message: 'Enter target database name:',
          default: defaultTargetDb,
          validate: (input) => {
            if (!input.trim()) return 'Database name cannot be empty';
            if (!/^[a-zA-Z0-9_]+$/.test(input)) {
              return 'Database name can only contain letters, numbers, and underscores';
            }
            return true;
          }
        }
      ]);
      await cloneDatabase(sourceDb.trim(), targetDb.trim());
      break;

    case 'reset':
      const { dbNameReset } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameReset',
          message: 'Enter database name to reset:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);

      const { confirmReset } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmReset',
          message: chalk.yellow(`This will drop and recreate "${dbNameReset}" with migrations. Continue?`),
          default: false
        }
      ]);

      if (confirmReset) {
        const { migrationsPath } = await inquirer.prompt([
          {
            type: 'input',
            name: 'migrationsPath',
            message: 'Enter migrations path:',
            default: './db/migrations'
          }
        ]);
        await resetDatabase(dbNameReset.trim(), migrationsPath.trim());
      } else {
        console.log(chalk.yellow('Operation cancelled.'));
      }
      break;
  }

  await continueOrBack(showDatabaseMenu);
}

// Migrations Menu
async function showMigrationsMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Migration Operations:',
      choices: migrationsMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  if (action === 'back') {
    await showMainMenu();
    return;
  }

  const { migrationsPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'migrationsPath',
      message: 'Enter migrations directory path:',
      default: context.lastMigrationsPath || './db/migrations'
    }
  ]);
  
  // Update context
  context.lastMigrationsPath = migrationsPath.trim();

  switch (action) {
    case 'create':
      const { migrationName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'migrationName',
          message: 'Enter migration name:',
          validate: (input) => input.trim() ? true : 'Migration name cannot be empty'
        }
      ]);
      await createDbmateMigration(migrationName.trim(), context.lastMigrationsPath);
      break;

    case 'up':
      const { dbNameUp } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameUp',
          message: 'Enter database name:',
          default: context.lastDbName || '',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      context.lastDbName = dbNameUp.trim();
      await runDbmateUp(context.lastDbName, context.lastMigrationsPath);
      break;

    case 'down':
      const { dbNameDown } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameDown',
          message: 'Enter database name:',
          default: context.lastDbName || '',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      context.lastDbName = dbNameDown.trim();
      await runDbmateDown(context.lastDbName, context.lastMigrationsPath);
      break;

    case 'status':
      const { dbNameStatus } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameStatus',
          message: 'Enter database name:',
          default: context.lastDbName || '',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      context.lastDbName = dbNameStatus.trim();
      await runDbmateStatus(context.lastDbName, context.lastMigrationsPath);
      break;
  }

  await continueOrBack(showMigrationsMenu);
}

// Backup & Restore Menu
async function showBackupMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Backup & Restore:',
      choices: backupMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  if (action === 'back') {
    await showMainMenu();
    return;
  }

  switch (action) {
    case 'backup':
      const { dbNameBackup } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameBackup',
          message: 'Enter database name to backup:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultBackupPath = `./backups/${dbNameBackup.trim()}_${timestamp}.sql`;
      
      const { backupPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'backupPath',
          message: 'Enter backup file path:',
          default: defaultBackupPath
        }
      ]);
      await backupDatabase(dbNameBackup.trim(), backupPath.trim());
      break;

    case 'restore':
      const { dbNameRestore } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameRestore',
          message: 'Enter database name to restore to:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);

      const { restorePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'restorePath',
          message: 'Enter backup file path:',
          default: './backups/',
          validate: (input) => input.trim() ? true : 'Path cannot be empty'
        }
      ]);

      const { confirmRestore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRestore',
          message: chalk.yellow(`This will restore data to "${dbNameRestore}". Continue?`),
          default: false
        }
      ]);

      if (confirmRestore) {
        await restoreDatabase(dbNameRestore.trim(), restorePath.trim());
      } else {
        console.log(chalk.yellow('Operation cancelled.'));
      }
      break;
  }

  await continueOrBack(showBackupMenu);
}

// SQL Operations Menu
async function showSqlMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'SQL Operations:',
      choices: sqlMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  if (action === 'back') {
    await showMainMenu();
    return;
  }

  switch (action) {
    case 'psql':
      const { dbNamePsql } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNamePsql',
          message: 'Enter database name to connect:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      await connectToPsql(dbNamePsql.trim());
      break;

    case 'exec':
      const { dbNameExec } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameExec',
          message: 'Enter database name:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);

      const { sqlFilePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'sqlFilePath',
          message: 'Enter SQL file path:',
          validate: (input) => input.trim() ? true : 'Path cannot be empty'
        }
      ]);
      await executeSqlFile(dbNameExec.trim(), sqlFilePath.trim());
      break;

    case 'tables':
      const { dbNameTables } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameTables',
          message: 'Enter database name:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);
      await listTables(dbNameTables.trim());
      break;

    case 'export':
      const { dbNameExport } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameExport',
          message: 'Enter database name to export schema:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        }
      ]);

      const timestampExport = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultExportPath = `./exports/${dbNameExport.trim()}_schema_${timestampExport}.sql`;

      const { exportPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'exportPath',
          message: 'Enter export file path:',
          default: defaultExportPath
        }
      ]);
      await exportSchema(dbNameExport.trim(), exportPath.trim());
      break;
  }

  await continueOrBack(showSqlMenu);
}

// Users & Permissions Menu
async function showUsersMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Users & Permissions:',
      choices: usersMenuChoices,
      pageSize: 10
    }
  ]);

  console.log('');

  if (action === 'back') {
    await showMainMenu();
    return;
  }

  switch (action) {
    case 'list':
      await listUsers();
      break;

    case 'create-user':
      const { newUsername, newUserPassword } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newUsername',
          message: 'Enter username:',
          validate: (input) => input.trim() ? true : 'Username cannot be empty'
        },
        {
          type: 'password',
          name: 'newUserPassword',
          message: 'Enter password:',
          mask: '*',
          validate: (input) => input ? true : 'Password cannot be empty'
        }
      ]);
      await createUser(newUsername.trim(), newUserPassword);
      break;

    case 'create-role':
      const { newRoleName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newRoleName',
          message: 'Enter role name:',
          validate: (input) => input.trim() ? true : 'Role name cannot be empty'
        }
      ]);

      const roleOptions = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'canLogin',
          message: 'Can this role login?',
          default: false
        },
        {
          type: 'confirm',
          name: 'canCreateDb',
          message: 'Can this role create databases?',
          default: false
        },
        {
          type: 'confirm',
          name: 'canCreateRole',
          message: 'Can this role create other roles?',
          default: false
        },
        {
          type: 'confirm',
          name: 'isSuperuser',
          message: 'Should this be a superuser role?',
          default: false
        }
      ]);
      
      await createRole(newRoleName.trim(), roleOptions);
      break;

    case 'grant':
      const { dbNameGrant, userGrant } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameGrant',
          message: 'Enter database name:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        },
        {
          type: 'input',
          name: 'userGrant',
          message: 'Enter username to grant access:',
          validate: (input) => input.trim() ? true : 'Username cannot be empty'
        }
      ]);
      await grantPermissions(dbNameGrant.trim(), userGrant.trim());
      break;

    case 'revoke':
      const { dbNameRevoke, userRevoke } = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbNameRevoke',
          message: 'Enter database name:',
          validate: (input) => input.trim() ? true : 'Database name cannot be empty'
        },
        {
          type: 'input',
          name: 'userRevoke',
          message: 'Enter username to revoke access:',
          validate: (input) => input.trim() ? true : 'Username cannot be empty'
        }
      ]);
      await revokePermissions(dbNameRevoke.trim(), userRevoke.trim());
      break;
  }

  await continueOrBack(showUsersMenu);
}

// Helper function to ask if user wants to continue or go back
async function continueOrBack(menuFunction) {
  console.log('');
  const { continueAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'continueAction',
      message: 'What would you like to do?',
      choices: [
        { name: 'Continue in this menu', value: 'continue' },
        { name: 'Back to main menu', value: 'back' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  console.log('');

  if (continueAction === 'continue') {
    await menuFunction();
  } else if (continueAction === 'back') {
    await showMainMenu();
  } else {
    console.log(chalk.cyan('👋 Goodbye!\n'));
    process.exit(0);
  }
}

// Start the CLI
async function main() {
  try {
    await showMainMenu();
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
