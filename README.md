# pgctl - PostgreSQL Database Operations CLI

A powerful and user-friendly Node.js CLI tool that provides comprehensive PostgreSQL database operations including database management, backup/restore, export functionality, and dbmate migration support. Built with modern ESM syntax and designed for cross-platform compatibility.

## 🚀 Quick Start with Binary Release

Download the appropriate binary for your operating system and start managing your PostgreSQL databases immediately - no installation required!

### 📦 Download Binary

Choose the appropriate binary for your system:

| Platform | Download | Recommended For |
|----------|----------|-----------------|
| **Windows x64** | `pgctl-win-x64.exe` | Windows 10/11 (64-bit) |
| **Linux x64** | `pgctl-linux-x64` | Ubuntu, Debian, CentOS, etc. |
| **macOS Intel** | `pgctl-macos-x64` | Intel-based Macs |
| **macOS Apple Silicon** | `pgctl-macos-arm64` | M1/M2/M3 Macs |

### 📋 Prerequisites

Before using the tool, ensure you have:

1. **PostgreSQL client tools** installed:
   - `psql`, `pg_dump`, `pg_restore`
   - Usually included with PostgreSQL installation

2. **dbmate** (optional, for migration features):
   - Install from [dbmate releases](https://github.com/amacneil/dbmate/releases)

3. **PostgreSQL server** running and accessible

### ⚙️ Setup Instructions

#### Windows Setup

1. **Download the binary:**
   ```cmd
   # Download pgctl-win-x64.exe from the releases page
   ```

2. **Set environment variables:**
   ```cmd
   # Using Command Prompt
   setx PG_HOST localhost
   setx PG_PORT 5432
   setx PG_USER postgres
   setx PG_PASSWORD your_postgres_password
   
   # Or using PowerShell
   [Environment]::SetEnvironmentVariable("PG_HOST", "localhost", "User")
   [Environment]::SetEnvironmentVariable("PG_PORT", "5432", "User")
   [Environment]::SetEnvironmentVariable("PG_USER", "postgres", "User")
   [Environment]::SetEnvironmentVariable("PG_PASSWORD", "your_password", "User")
   ```

3. **Restart your terminal** to apply environment variables

4. **Run the tool:**
   ```cmd
   pgctl-win-x64.exe
   ```

#### Linux Setup

1. **Download and make executable:**
   ```bash
   # Download the binary
   wget https://github.com/yourusername/pgctl/releases/latest/download/pgctl-linux-x64
   
   # Make executable
   chmod +x pgctl-linux-x64
   ```

2. **Set environment variables:**
   ```bash
   # Temporary (current session only)
   export PG_HOST=localhost
   export PG_PORT=5432
   export PG_USER=postgres
   export PG_PASSWORD=your_postgres_password
   
   # Make permanent by adding to ~/.bashrc or ~/.zshrc
   echo 'export PG_HOST=localhost' >> ~/.bashrc
   echo 'export PG_PORT=5432' >> ~/.bashrc
   echo 'export PG_USER=postgres' >> ~/.bashrc
   echo 'export PG_PASSWORD=your_postgres_password' >> ~/.bashrc
   
   source ~/.bashrc
   ```

3. **Run the tool:**
   ```bash
   ./pgctl-linux-x64
   ```

#### macOS Setup

1. **Download and make executable:**
   ```bash
   # For Intel Macs
   wget https://github.com/yourusername/pgctl/releases/latest/download/pgctl-macos-x64
   chmod +x pgctl-macos-x64
   
   # For Apple Silicon Macs (M1/M2/M3)
   wget https://github.com/yourusername/pgctl/releases/latest/download/pgctl-macos-arm64
   chmod +x pgctl-macos-arm64
   ```

2. **Set environment variables:**
   ```bash
   # Temporary (current session only)
   export PG_HOST=localhost
   export PG_PORT=5432
   export PG_USER=postgres
   export PG_PASSWORD=your_postgres_password
   
   # Make permanent by adding to ~/.zshrc (macOS default shell)
   echo 'export PG_HOST=localhost' >> ~/.zshrc
   echo 'export PG_PORT=5432' >> ~/.zshrc
   echo 'export PG_USER=postgres' >> ~/.zshrc
   echo 'export PG_PASSWORD=your_postgres_password' >> ~/.zshrc
   
   source ~/.zshrc
   ```

3. **Run the tool:**
   ```bash
   # For Intel Macs
   ./pgctl-macos-x64
   
   # For Apple Silicon Macs
   ./pgctl-macos-arm64
   ```

### 🎯 How to Use

1. **Start the tool** by running the binary
2. **Navigate the menu** using arrow keys
3. **Follow the interactive prompts** for each operation
4. The tool provides clear feedback and confirmations for all operations

## 🚀 Features

### Database Management
- **📋 List all databases** - View all non-template databases in your PostgreSQL instance
- **➕ Create a database** - Create new databases with validation
- **🗑️ Drop a database** - Safely delete databases with confirmation prompts
- **🔌 Connect to psql** - Interactive psql sessions for direct database access

### Backup & Restore Operations
- **💾 Backup a database** - Create compressed backups with automatic timestamping
- **📦 Restore a database** - Restore from backup files with multiple options
- **📂 List backups** - Browse available backup files
- **🗑️ Delete backups** - Clean up old backup files

### Export Functionality
- **📤 Export databases** - Export database schemas and data
- **📂 List exports** - View exported files
- **🗑️ Delete exports** - Manage export files

### Migration Support (dbmate)
- **⬆️ Run dbmate up** - Apply pending migrations
- **⬇️ Run dbmate down** - Rollback migrations
- **📊 Run dbmate status** - Check migration status
- **🆕 Create new migration** - Generate new migration files

### Additional Features
- **Interactive Menu System** - Easy-to-use command-line interface with visual feedback
- **Environment Configuration** - Secure credential management via environment variables
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Standalone Executables** - No Node.js installation required for binary releases

## 💡 Example Usage Scenarios

### Scenario 1: Database Backup Workflow

```bash
# 1. Start pgctl
./pgctl-linux-x64

# 2. List existing databases
> Select: "📋 List all databases"

# 3. Backup a database
> Select: "💾 Backup a database"
> Enter database name: "production_db"
# ✅ Backup created: backups/production_db_2024-12-02T10-30-15.sql

# 4. List backups to verify
> Select: "📂 List backups"
```

### Scenario 2: Database Restore Workflow

```bash
# 1. Start pgctl
./pgctl-macos-arm64

# 2. View available backups
> Select: "📂 List backups"

# 3. Restore from backup
> Select: "📦 Restore a database"
> Choose file: "production_db_2024-12-02T10-30-15.sql"
> Select option: "Create new database with date suffix"
# ✅ Database restored: production_db_2024_12_02
```

### Scenario 3: Migration Workflow

```bash
# 1. Create a new database
> Select: "➕ Create a database"
> Enter name: "my_new_project"

# 2. Create a migration
> Select: "🆕 Create new migration"
> Enter description: "create_users_table"

# 3. Run migrations
> Select: "⬆️ Run dbmate up"

# 4. Check status
> Select: "📊 Run dbmate status"
```

## 🔐 Environment Variables

The tool requires the following environment variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PG_HOST` | PostgreSQL server hostname | `localhost` | Yes |
| `PG_PORT` | PostgreSQL server port | `5432` | Yes |
| `PG_USER` | PostgreSQL username | `postgres` | Yes |
| `PG_PASSWORD` | PostgreSQL password | `yourpassword` | Yes |
| `DATABASE_URL` | Full connection string for dbmate | `postgres://user:pass@host:port/db?sslmode=disable` | Optional* |

*Required only for dbmate migration commands

## 🖥️ Platform-Specific Notes

### Windows
- Ensure PostgreSQL's `bin` directory is in your PATH
- Example: `C:\Program Files\PostgreSQL\16\bin`
- For dbmate, download from [GitHub releases](https://github.com/amacneil/dbmate/releases) and add to PATH
- Use PowerShell or Command Prompt to run the executable
- Environment variables persist after setting with `setx`

### macOS
- Install PostgreSQL via Homebrew: `brew install postgresql`
- Install dbmate via Homebrew: `brew install dbmate`
- For Apple Silicon (M1/M2/M3), use the ARM64 executable
- Use Terminal or iTerm2 to run the executable
- May need to allow the app in Security & Privacy settings on first run

### Linux
- Install PostgreSQL: `sudo apt-get install postgresql postgresql-client` (Ubuntu/Debian)
- Install dbmate: Download from [GitHub releases](https://github.com/amacneil/dbmate/releases)
- Ensure executables have proper permissions: `chmod +x pgctl-linux-x64`
- Works on most distributions including Ubuntu, Debian, CentOS, Fedora, etc.

## 🔧 Installing dbmate (Optional)

dbmate is required only if you want to use migration commands.

### Installation Options:

**macOS (Homebrew):**
```bash
brew install dbmate
```

**Linux:**
```bash
sudo curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64
sudo chmod +x /usr/local/bin/dbmate
```

**Windows (Scoop):**
```bash
scoop install dbmate
```

**Windows (Manual):**
1. Download `dbmate-windows-amd64.exe` from [dbmate releases](https://github.com/amacneil/dbmate/releases)
2. Rename to `dbmate.exe`
3. Place in a directory in your PATH

**Verify installation:**
```bash
dbmate --version
```

## 🛠️ Development Setup

### Option 1: Run from Source

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pgctl.git
   cd pgctl
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # On Linux/macOS:
   cp env.example .env
   
   # On Windows:
   copy env.example .env
   ```

4. **Edit `.env` with your PostgreSQL credentials:**
   ```env
   PG_HOST=localhost
   PG_PORT=5432
   PG_USER=postgres
   PG_PASSWORD=yourpassword
   DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/your_database?sslmode=disable
   ```

5. **Run the CLI:**
   ```bash
   npm start
   # or
   node index.js
   ```

### Option 2: Install Globally

```bash
npm install -g .
pgctl
```

## 📦 Building Executables

To create standalone executables for all platforms:

```bash
# Install pkg globally if not already installed
npm install -g pkg

# Build for all platforms
npm run build

# Or build for specific platforms
npm run build:win          # Windows only
npm run build:linux        # Linux only
npm run build:macos        # macOS x64 only
npm run build:macos-arm    # macOS ARM64 only
npm run build:all          # All platforms separately
```

The executables will be created in the `build/` directory.

### Manual Build Command

```bash
pkg . --targets node18-win-x64,node18-macos-x64,node18-macos-arm64,node18-linux-x64 --out-path ./build/
```

## 🐛 Common Issues & Solutions

### "psql: command not found"
**Problem:** PostgreSQL client tools are not in your system PATH

**Solution:**
- **Windows:** Add PostgreSQL's bin directory to PATH (`C:\Program Files\PostgreSQL\16\bin`)
- **macOS:** Install PostgreSQL via Homebrew: `brew install postgresql`
- **Linux:** Install PostgreSQL client: `sudo apt-get install postgresql-client`
- Restart your terminal after changing PATH

### "dbmate: command not found"
**Problem:** dbmate is not installed or not in PATH

**Solution:**
- Install dbmate following the instructions in the [Installing dbmate](#-installing-dbmate-optional) section
- Verify installation: `dbmate --version`
- Restart your terminal after installation

### Authentication Failed / Connection Refused
**Problem:** Cannot connect to PostgreSQL server

**Solution:**
1. Verify PostgreSQL is running:
   - **Windows:** Check Services for "postgresql-x64-XX"
   - **macOS:** `brew services list`
   - **Linux:** `sudo systemctl status postgresql`

2. Check credentials in environment variables:
   ```bash
   # Linux/macOS
   echo $PG_USER
   echo $PG_HOST
   
   # Windows
   echo %PG_USER%
   echo %PG_HOST%
   ```

3. Test connection manually:
   ```bash
   psql -h localhost -p 5432 -U postgres -c "SELECT 1"
   ```

### "Missing required environment variables"
**Problem:** Environment variables are not set or not loaded

**Solution:**
- Verify environment variables are set correctly
- **Windows:** Restart your terminal/command prompt after using `setx`
- **Linux/macOS:** Run `source ~/.bashrc` or `source ~/.zshrc` after adding exports
- Check if variables are loaded: `echo $PG_USER` (Linux/macOS) or `echo %PG_USER%` (Windows)

### Permission Denied (Linux/macOS)
**Problem:** Binary doesn't have execute permissions

**Solution:**
```bash
chmod +x pgctl-linux-x64
# or
chmod +x pgctl-macos-arm64
```

### "App can't be opened" on macOS
**Problem:** macOS Gatekeeper blocking the executable

**Solution:**
1. Right-click the executable and select "Open"
2. Click "Open" in the security dialog
3. Or disable Gatekeeper temporarily:
   ```bash
   xattr -d com.apple.quarantine pgctl-macos-arm64
   ```

### Backup/Restore Issues
**Problem:** Backup or restore operations fail

**Solution:**
- Ensure sufficient disk space for backups
- Verify you have read/write permissions in the `backups/` directory
- Check that `pg_dump` and `pg_restore` are available in PATH
- For large databases, ensure adequate system resources

## 📖 Advanced Usage

### Custom Backup Location

Backups are stored in the `backups/` directory by default. You can modify this by editing the source code or setting up symbolic links:

```bash
# Linux/macOS - Create symbolic link to different location
ln -s /path/to/your/backup/location backups

# Windows - Create directory junction
mklink /J backups D:\MyBackups
```

### Automated Backups with Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM (example)
0 2 * * * cd /path/to/pgctl && ./pgctl-linux-x64 backup production_db
```

### Integration with CI/CD

You can use pgctl in your CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Backup database before deployment
  env:
    PG_HOST: ${{ secrets.PG_HOST }}
    PG_USER: ${{ secrets.PG_USER }}
    PG_PASSWORD: ${{ secrets.PG_PASSWORD }}
    PG_PORT: 5432
  run: |
    chmod +x pgctl-linux-x64
    ./pgctl-linux-x64 backup production_db
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- Use modern ES6+ JavaScript syntax
- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test on multiple platforms if possible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

**Need help?**

1. Check [Common Issues](#-common-issues--solutions) section above
2. Review the documentation thoroughly
3. Search existing [GitHub Issues](https://github.com/yourusername/pgctl/issues)
4. Open a new issue with:
   - Your operating system and version
   - PostgreSQL version (`psql --version`)
   - Complete error message
   - Steps to reproduce the problem

## 🔗 Quick Reference

**Binary Downloads:**
- Windows: `pgctl-win-x64.exe`
- Linux: `./pgctl-linux-x64`
- macOS Intel: `./pgctl-macos-x64`
- macOS Apple Silicon: `./pgctl-macos-arm64`

**Required Environment Variables:**
- `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`

**Optional for Migrations:**
- `DATABASE_URL` (for dbmate)

---

**Built with ❤️ using Node.js, inquirer, and chalk**

⭐ **Star this repo** if you find it helpful!
