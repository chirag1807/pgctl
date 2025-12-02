const dotenv = require('dotenv');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

/**
 * Load and validate environment configuration
 */
function loadConfig() {
  // Load environment variables from .env file
  // const envPath = path.join(__dirname, '..', '.env');
  const envPath = '.env';
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

    console.log(chalk.yellow('\nPlease provide the missing environment variables to continue.'));
    process.exit(1);
  }
}

/**
 * Display current configuration
 */
function displayConfig() {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  pgctl - PostgreSQL DB Ops CLI'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.bold.white('📡 Current Configuration:\n'));
  console.log(`  ${chalk.dim('Host:')}     ${chalk.green(process.env.PG_HOST)}`);
  console.log(`  ${chalk.dim('Port:')}     ${chalk.green(process.env.PG_PORT)}`);
  console.log(`  ${chalk.dim('User:')}     ${chalk.green(process.env.PG_USER)}`);
  console.log(`  ${chalk.dim('Password:')} ${chalk.green('•'.repeat(process.env.PG_PASSWORD.length))}\n`);
}

module.exports = {
  loadConfig,
  displayConfig
};

