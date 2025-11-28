# PostgreSQL Database Operations CLI

A powerful and user-friendly Node.js CLI tool that provides a wrapper for PostgreSQL operations and dbmate migrations. Built with modern ESM syntax and designed for cross-platform compatibility.

## 🚀 Features

- **Interactive Menu System**: Easy-to-use command-line interface with visual feedback
- **Database Management**: List, create, and drop PostgreSQL databases
- **Direct psql Access**: Connect to any database interactively
- **Migration Support**: Integrated dbmate commands for database migrations
- **Environment Configuration**: Secure credential management via `.env` files
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Standalone Executables**: Can be compiled into single binary files

## 📋 Requirements

### Runtime Requirements
- Node.js 18.0.0 or higher (for development/running from source)
- PostgreSQL installed with `psql` command-line tool in PATH
- dbmate (optional, only needed for migration commands)

### Development Requirements
- npm or yarn package manager

## 🔧 Installation

### Option 1: Run from Source

1. Clone or download this repository:
```bash
git clone <repository-url>
cd postgres-db-ops
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
# On Linux/macOS:
cp env.example .env

# On Windows:
copy env.example .env
```

4. Edit `.env` with your PostgreSQL credentials:
```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=yourpassword
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/your_database?sslmode=disable
```

Note: `PG_DATABASE` is not required in .env - the tool will ask you for the database name when needed.

5. Run the CLI:
```bash
npm start
# or
node cli.js
```

### Option 2: Install Globally

```bash
npm install -g .
postgres-db-ops
```

### Option 3: Use Pre-built Executables

Download the appropriate executable for your platform from the releases page:
- `postgres-db-ops-win.exe` - Windows (x64)
- `postgres-db-ops-macos` - macOS (x64)
- `postgres-db-ops-macos-arm64` - macOS (ARM64/Apple Silicon)
- `postgres-db-ops-linux` - Linux (x64)

Place the executable in your desired location, create a `.env` file in the same directory, and run it.

## 📦 Building Executables

To create standalone executables for all platforms:

```bash
# Install pkg globally if not already installed
npm install -g pkg

# Build for all platforms
npm run build

# Or build for specific platforms
npm run build:win      # Windows only
npm run build:mac      # macOS only (both x64 and ARM64)
npm run build:linux    # Linux only
```

The executables will be created in the `dist/` directory:
- `dist/postgres-db-ops-win.exe` - Windows executable
- `dist/postgres-db-ops-macos` - macOS x64 executable
- `dist/postgres-db-ops-macos-arm64` - macOS ARM64 executable
- `dist/postgres-db-ops-linux` - Linux executable

### Manual Build Command

```bash
pkg . --targets node18-win-x64,node18-macos-x64,node18-macos-arm64,node18-linux-x64 --output-path ./dist
```

## 🎯 Usage

Run the CLI and follow the interactive prompts:

```bash
node cli.js
```

You'll see a menu with the following options:

### Available Operations

1. **📋 List all databases**
   - Displays all non-template databases in your PostgreSQL instance
   - Useful for getting an overview of available databases

2. **➕ Create a database**
   - Creates a new PostgreSQL database
   - Validates database name (alphanumeric and underscores only)
   - Checks if database already exists

3. **🗑️ Drop a database**
   - Deletes an existing database
   - Includes confirmation prompt to prevent accidental deletion
   - Automatically terminates existing connections before dropping

4. **🔌 Connect to psql**
   - Opens an interactive psql session for a specified database
   - Full access to PostgreSQL command-line features
   - Type `\q` or press `Ctrl+C` to exit

5. **⬆️ Run dbmate up**
   - Applies pending database migrations
   - Requires dbmate to be installed
   - Uses DATABASE_URL from environment

6. **⬇️ Run dbmate down**
   - Rolls back the most recent migration
   - Requires dbmate to be installed
   - Includes built-in confirmation

7. **📊 Run dbmate status**
   - Shows the status of all migrations
   - Displays applied and pending migrations
   - Requires dbmate to be installed

8. **❌ Exit**
   - Closes the application

## 🔐 Environment Variables

The tool requires the following environment variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PG_HOST` | PostgreSQL server hostname | `localhost` | Yes |
| `PG_PORT` | PostgreSQL server port | `5432` | Yes |
| `PG_USER` | PostgreSQL username | `postgres` | Yes |
| `PG_PASSWORD` | PostgreSQL password | `yourpassword` | Yes |
| `DATABASE_URL` | Full connection string for dbmate (optional) | `postgres://user:pass@host:port/db?sslmode=disable` | No |

**Note**: The tool does not use a default database from environment variables. You will be prompted to enter the database name when performing operations.

## 🖥️ Platform-Specific Notes

### Windows
- Make sure PostgreSQL's `bin` directory is in your PATH
- Example: `C:\Program Files\PostgreSQL\15\bin`
- For dbmate, download from [GitHub releases](https://github.com/amacneil/dbmate/releases) and add to PATH
- The tool automatically uses PowerShell for process spawning

### macOS
- Install PostgreSQL via Homebrew: `brew install postgresql`
- Install dbmate via Homebrew: `brew install dbmate`
- For Apple Silicon (M1/M2), use the ARM64 executable

### Linux
- Install PostgreSQL: `sudo apt-get install postgresql postgresql-client`
- Install dbmate: Download from [GitHub releases](https://github.com/amacneil/dbmate/releases)
- Ensure executables have proper permissions: `chmod +x postgres-db-ops-linux`

## 🔌 Installing dbmate

dbmate is required only if you want to use migration commands.

### Installation Options:

**macOS (Homebrew)**:
```bash
brew install dbmate
```

**Linux**:
```bash
sudo curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64
sudo chmod +x /usr/local/bin/dbmate
```

**Windows (Scoop)**:
```bash
scoop install dbmate
```

**Or download directly**: [dbmate releases](https://github.com/amacneil/dbmate/releases)

## 🛠️ Extending the CLI

### Adding New Menu Options

To add new database operations, follow these steps:

1. **Add the operation function** in `lib/db-operations.js`:

```javascript
export async function yourNewOperation(params) {
  console.log(chalk.blue('🔧 Running your operation...\n'));
  
  // Your implementation here
  const result = await executePsqlCommand('YOUR SQL HERE');
  
  if (result.success) {
    console.log(chalk.green('✓ Operation completed!'));
  } else {
    console.log(chalk.red('✗ Operation failed:'));
    console.log(chalk.red(result.stderr));
  }
}
```

2. **Import the function** in `cli.js`:

```javascript
import {
  listDatabases,
  createDatabase,
  // ... other imports
  yourNewOperation  // Add this
} from './lib/db-operations.js';
```

3. **Add menu choice** in the `menuChoices` array:

```javascript
const menuChoices = [
  // ... existing choices
  { name: '🔧 Your New Operation', value: 'your-operation' },
  { name: '❌ Exit', value: 'exit' }
];
```

4. **Add switch case** in the `showMenu()` function:

```javascript
switch (action) {
  // ... existing cases
  case 'your-operation':
    await yourNewOperation();
    break;
  // ...
}
```

### Adding Custom psql Commands

You can extend the `executePsqlCommand` function to run any PostgreSQL query:

```javascript
const result = await executePsqlCommand(
  'SELECT version();',
  { database: 'postgres' }
);
```

### Adding External Tool Integration

Similar to dbmate integration, you can add other tools:

```javascript
export async function runCustomTool() {
  return new Promise((resolve) => {
    const process = spawn('your-tool', ['args'], {
      env: process.env,
      stdio: 'inherit',
      shell: platform() === 'win32'
    });
    
    process.on('close', (code) => {
      console.log(code === 0 ? 
        chalk.green('✓ Success!') : 
        chalk.red('✗ Failed!')
      );
      resolve();
    });
  });
}
```

## 📝 Example Workflow

Here's a typical workflow using this tool:

```bash
# 1. Start the CLI
node cli.js

# 2. List existing databases to see what's available
> Select: "📋 List all databases"

# 3. Create a new database for your project
> Select: "➕ Create a database"
> Enter name: "my_new_project"

# 4. Run migrations using dbmate
> Select: "⬆️ Run dbmate up"

# 5. Check migration status
> Select: "📊 Run dbmate status"

# 6. Connect to the database to verify
> Select: "🔌 Connect to psql"
> Enter database: "my_new_project"
> In psql: \dt  (list tables)
> In psql: \q   (exit)

# 7. Exit the tool
> Select: "❌ Exit"
```

## 🐛 Troubleshooting

### "psql: command not found"
- Ensure PostgreSQL is installed and `psql` is in your system PATH
- On Windows, add PostgreSQL's bin directory to PATH
- Restart your terminal after changing PATH

### "dbmate: command not found"
- Install dbmate following the instructions in the "Installing dbmate" section
- Verify installation: `dbmate --version`

### Authentication Errors
- Double-check credentials in your `.env` file
- Ensure your PostgreSQL user has necessary permissions
- Test connection manually: `psql -h localhost -U postgres -d postgres`

### "Missing required environment variables"
- Make sure your `.env` file is in the same directory as the CLI
- Verify all required variables are set (PG_HOST, PG_USER, PG_PASSWORD, PG_PORT)

### Permission Errors on Linux/macOS
- Make executable runnable: `chmod +x postgres-db-ops-linux`
- For psql/dbmate access issues, check user permissions in PostgreSQL

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new features
- Improve error handling
- Enhance documentation
- Report bugs
- Submit pull requests

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review PostgreSQL and dbmate documentation for database-specific questions

---

**Built with ❤️ using Node.js, inquirer, and chalk**
