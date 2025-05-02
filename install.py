from os import chmod, makedirs, path
import yaml
import datetime
from jinja2 import Environment, FileSystemLoader
import secrets


def create_secret_file(file_path: str, content: str):
    """Creates a secret file with the given content."""
    makedirs(path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as f:
        f.write(content.strip() + "\n")
    chmod(file_path, 0o600)


def generate_random_secret(length=32):
    """Generates a random hexadecimal secret."""
    secrets.token_hex(length)
    return


def generate_docker_compose(
    template_file: str, config: dict, output_file="dist/docker-compose.yml"
):
    """Generates a Docker Compose file from a Jinja2 template."""
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template(template_file)
    rendered_yaml = template.render(config)
    makedirs(path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        f.write(rendered_yaml)
    print(f"Generated '{output_file}' successfully")


def write_dockerfile(output_file="dist/db.Dockerfile"):
    """Writes a Dockerfile for the PostgreSQL database."""
    dockerfile_content = """
FROM postgres:17.4
ENV BACKUP_FILENAME=data.sql
ARG backup_file=./CARTOBM_backup.sql
ARG db_init_script=./db_init.sh
COPY ${{backup_file']}}* /${{BACKUP_FILENAME}}
COPY ${{db_init_script}}* /docker-entrypoint-init.d/db_init.sh
RUN if [ -f /docker-entrypoint-init.d/db_init.sh ] then \
        chmod +x /docker-entrypoint-init.d/db_init.sh \
    fi
"""
    makedirs(path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        f.write(dockerfile_content)
    print(f"Generated '{output_file}' successfully")


def generate_nginx_config(
    template_file: str, config: dict, output_file="dist/nginx.conf"
):
    """Generates an Nginx configuration file from a Jinja2 template."""
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template(template_file)
    rendered_conf = template.render(config)
    makedirs(path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        f.write(rendered_conf)
    print(f"Generated '{output_file}' successfully")


def main():
    print("Welcome to the Knowage Installation Setup!")
    print("Let's configure your Knowage Deployment.\n")

    config = {}

    print("--- Database Configuration ---")
    config["db_port"] = (
        input("Enter the database PostgreSQL port (default 5432): ") or 5432
    )
    config["db_name"] = (
        input("Enter the database name (default knowage): ") or "knowage"
    )
    db_user = input("Enter the database user name: ")
    db_pass = input("Enter the database user password: ")
    db_secrets_path = "secrets/db_secrets.txt"

    create_secret_file(db_secrets_path, f"{db_user}\n{db_pass}")
    config["backup_file"] = (
        input(
            "Enter the path to the PostgreSQL backup file (relative to the script directory): "
        )
        or ""
    )
    config["db_init_file"] = (
        input(
            "Enter the path to the PostgreSQL initialization script (relative to the script directory): "
        )
        or ""
    )

    # Storage configuration
    print("\n--- Storage Configuration ---")
    config["storage_api_port"] = (
        input("Enter the storage API port (default 9000): ") or "9000"
    )
    config["storage_console_port"] = (
        input("Enter the storage console port (default 9001): ") or "9001"
    )
    config["storage_browser_url"] = (
        input("Enter the storage browser URL (optional): ") or ""
    )

    # Cache configuration
    print("\n--- Cache Configuration (MySQL) ---")
    cache_user = input("Enter the MySQL username: ")
    cache_pass = input("Enter the MySQL password: ")
    cache_root_pass = input("Enter the MySQL root password: ")
    cache_secrets_path = "secrets/cache_secrets.txt"
    create_secret_file(
        cache_secrets_path, f"{cache_user}\n{cache_pass}\n{cache_root_pass}"
    )
    config["cache_secrets_path"] = cache_secrets_path

    # Knowage configuration
    print("\n--- Knowage Configuration ---")
    config["knowage_port"] = input("Enter the host port for the Knowage application")


if __name__ == "__main__":
    main()
