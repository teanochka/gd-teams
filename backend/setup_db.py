import os
import shutil
import subprocess
import sys
from pathlib import Path


def run_command(command, cwd=None):
    print(f"Executing: {' '.join(command)}")
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
        )

        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

        if result.returncode != 0:
            print(f"Error executing command: {' '.join(command)}")
            return False
        return True
    except FileNotFoundError:
        print(f"Command not found: {' '.join(command)}")
        return False
    except NotADirectoryError as e:
        print(f"Invalid working directory '{cwd}': {e}")
        return False


def main():
    # 1. Setup paths
    backend_dir = Path(__file__).resolve().parent
    project_root = backend_dir.parent
    venv_python = backend_dir / '.venv' / 'Scripts' / 'python.exe'

    if not venv_python.is_file():
        # Fallback to system python if venv is not found or structured differently
        venv_python = Path(sys.executable)
        print(f"Virtual environment not found at {venv_python}, using system python.")

    # 2. Create database if it doesn't exist (for local Postgres)
    print("\nChecking/Creating database 'gd_teams'...")
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        
        # Connect to default 'postgres' database to create the new one
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='jsu7b3UI',
            host='localhost',
            port='5432'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'gd_teams'")
        exists = cur.fetchone()
        if not exists:
            cur.execute('CREATE DATABASE gd_teams')
            print("Database 'gd_teams' created.")
        else:
            print("Database 'gd_teams' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Could not ensure database existence via psycopg2: {e}")
        print("Continuing... (Assuming database exists or will be handled by migrations)")

    # 4. Apply migrations
    print("\nApplying Django migrations...")
    if not run_command([str(venv_python), 'manage.py', 'migrate'], cwd=str(backend_dir)):
        print("Failed to apply migrations.")
        return

    # 5. Prepare db.json for migration script
    # migrate_data.py expects db.json in backend/ folder
    source_db = project_root / 'db.json'
    target_db = backend_dir / 'db.json'

    if source_db.exists():
        shutil.copy2(source_db, target_db)
        print(f"\nCopied {source_db} to {target_db}")
    else:
        print(f"\nWarning: {source_db} not found!")

    # 6. Run migration script
    print("\nRunning data migration...")
    if not run_command([str(venv_python), 'migrate_data.py'], cwd=str(backend_dir)):
        print("Failed to run data migration.")
        return

    print("\nSetup and migration completed successfully!")

if __name__ == "__main__":
    main()
