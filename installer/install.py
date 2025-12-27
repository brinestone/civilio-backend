import argparse
import configparser
import secrets
import sys
from os import getcwd, makedirs, path

from jinja2 import Environment, FileSystemLoader

config = configparser.ConfigParser(interpolation=configparser.ExtendedInterpolation())
args: argparse.Namespace
is_first_run = False


def generate_random_secret(length=32) -> str:
    """Generates a random hexadecimal secret."""
    return secrets.token_hex(length)


def get_secret_refs():
    """Generates a dictionary of secret references for Docker Compose."""
    global config
    secret_refs = {
        "db_user": "${DB_USER}",
        "db_pass": "${DB_PASS}",
        "db_name": "${DB_NAME}",
        "cache_user": "${CACHE_USER}",
        "cache_pass": "${CACHE_PASS}",
        "cache_db_name": "${CACHE_DB_NAME}",
        "cache_root_pass": "${CACHE_ROOT_PASS}",
        "password_encryption_secret": "${PASSWORD_ENCRYPTION_SECRET}",
        "hmac_key": "${HMAC_KEY}",
        "sensible_data_encryption_secret": "${SENSIBLE_DATA_ENCRYPTION_SECRET}",
    }
    return secret_refs


def generate_docker_compose(template_file: str):
    """Generates a Docker Compose file from a Jinja2 template."""
    global config
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template(template_file)
    extracted_config = {"config": config_to_dict()}
    rendered_yaml = template.render(extracted_config)
    output_file = config["drop.outputs"]["docker-compose"]
    makedirs(path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        f.write(rendered_yaml)
    if args.verbose:
        print(f"Generated '{output_file}' successfully")


def config_to_dict(exclude_secrets=True) -> dict:
    """Converts the configparser object to a nested dictionary with interpolation."""
    global config
    result = {}
    for section in config.sections():
        if exclude_secrets and section.startswith("secrets"):
            continue
        result[section] = {}
        for key in config[section]:
            value = config.get(section, key)
            if value.lower() in ["1", "0", "true", "false"]:
                result[section][key] = config.getboolean(section, key)
            else:
                try:
                    result[section][key] = int(value)
                except ValueError:
                    result[section][key] = value
    return result


def generate_nginx_config(template_file: str):
    """Generates an Nginx configuration file from a Jinja2 template."""
    global config
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template(template_file)
    extracted_config = {"config": config_to_dict()}
    rendered_conf = template.render(extracted_config)
    output_file = config["drop.outputs"]["nginx_conf"]
    makedirs(path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        f.write(rendered_conf)
    if args.verbose:
        print(f"Generated '{output_file}' successfully")


def make_config_dirs(root: str):
    """Creates necessary configuration directories."""
    global config
    mount_dirs = [v for v in [*config["drop.mounts"].values()]]
    for d in mount_dirs:
        dir_path = path.join(root, d)
        makedirs(dir_path, exist_ok=True)
        if args.verbose:
            print(f"Created directory: {dir_path}")


def fix_paths():
    """Make all volume and mount paths relative to the current directory"""
    global config
    for section in ["drop.mounts", "drop.outputs"]:
        for key in config[section]:
            value = config[section].get(key)
            if not value:
                continue
            p = path.abspath(value)
            config[section][key] = str(p)


def process_templates():
    """Processes all templates and generates necessary files."""
    print("Processing templates...")
    global config
    if config["gateway"].getboolean("proxy"):
        generate_nginx_config("templates/nginx.conf.j2")
    generate_docker_compose("templates/docker-compose.j2")
    generate_ldap_config_file("templates/ldap.properties.j2")
    # if config["advanced.ldap"].get("deployment_type") == "self-hosted":
    #     generate_ldap_memberof_overlay("templates/config-memberof.ldif.j2")
    if args.force_config or args.clean_install:
        generate_env_file()


def generate_ldap_memberof_overlay(template_file: str):
    """Generates LDAP memberof overlay for openldap"""
    global config
    config_path = config["drop.outputs"].get("ldap-memberof-ldif")
    if not config_path:
        raise Exception("LDAP memberof overlay file was not configured and is required")
    makedirs(path.dirname(config_path), exist_ok=True)
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template(template_file)
    render = template.render()
    with open(config_path, "w") as handle:
        handle.write(render)
    if args.verbose:
        print(f'Generated "{config_path}" successfully')


def generate_ldap_config_file(template_file: str):
    """Generates LDAP connector file for Knowage container"""
    global config
    config_path = config["drop.outputs"].get("ldap-connector")
    if not config_path:
        raise Exception("LDAP configuration file was not configured and is required")
    makedirs(path.dirname(config_path), exist_ok=True)
    env = Environment(loader=FileSystemLoader("."))
    extracted_config = {"config": config_to_dict()}
    template = env.get_template(template_file)
    render = template.render(extracted_config)
    with open(config_path, "w") as handle:
        handle.write(render)
    if args.verbose:
        print(f'Generated "{config_path}" successfully')


def generate_env_file():
    """Generates a .env file for Docker Compose."""
    global config
    env_file_path = config["drop.outputs"].get("env")

    if not env_file_path:
        raise Exception(".env file path configuration was not set and is required")

    makedirs(path.dirname(env_file_path), exist_ok=True)
    with open(env_file_path, "w") as f:
        for section in config.sections():
            if not section.startswith("secrets"):
                continue
            for key, value in config[section].items():
                env_key = f"{section.replace('secrets.', '').replace('secrets', '')}_{key}".replace(
                    ".", "_"
                ).upper()
                if env_key[0] == "_":
                    env_key = env_key[1:]
                f.write(f"{env_key}={value}\n")
            config.remove_section(section)
    if args.verbose:
        print(f"Generated '{env_file_path}' successfully")


def load_existing_config(load_new_secrets=False):
    """Loads an existing configuration from a YAML file."""
    global config
    print("Loading existing configuration...")
    cache_dir = path.abspath(path.expanduser("~/.cache/knowage"))
    makedirs(cache_dir, exist_ok=True)
    config_file = path.join(cache_dir, "config.ini")

    if not path.exists(config_file):
        config.read_dict({**default_config(), "status": {"configured": False}})
        is_first_run = True
    else:
        is_first_run = False

    try:
        config.read(config_file)
        if not config.has_section("status"):
            config.add_section("status")
            config.set("status", "configured", "1")
    except configparser.Error as e:
        msg = f"Error while reading config file: {e}"
        print(msg)
        config.read_dict({**default_config(), "status": {"configured": False}})
    if load_new_secrets or is_first_run:
        block = default_secrets()
        for section, values in block.items():
            if not config.has_section(section):
                config.add_section(section)
                for key, value in values.items():
                    config.set(section, key, value)


def default_config():
    """Returns a default configuration dictionary."""
    return {
        "drop": {
            "path": path.abspath(
                path.expanduser(f"~/.{str(args.project_name).lower()}")
            )
        },
        "gateway": {
            "proxy": "0",
            "domain": f"{str(args.project_name).lower().replace(' ', '_')}.cm",
        },
        "gateway.nginx.ports": {"http": "80", "https": "443"},
        "gateway.nginx.https": {
            "enable": "0",
        },
        "gateway.knowage": {"expose": "0", "port": "8080", "sub_domain": "knowage"},
        "advanced": {
            "modify": "0",
        },
        "advanced.db": {
            "name": "knowage",
            "expose": "0",
            "port": "5432",
        },
        "advanced.ldap": {
            "enable": "1",
            "enable_tls": "${gateway.nginx.https:enable}",
            "port": "389",
            "ldaps_port": "636",
            "host": "ldap",
            "deployment_type": "self-hosted",
        },
        "ldap.dn": {
            "prefix": "cn=",
            "suffix": "",
            "base": "",
        },
        "ldap.attrs": {
            "role_name": "memberOf",
            "role_field": "cn",
            "superuser": "maintainers",
        },
        "advanced.ldap.ui": {"enable": "1", "port": "9090"},
        "drop.mounts": {
            "db_data": "${drop:path}/mnt/db_data",
            "cache_data": "${drop:path}/mnt/cache_data",
            "knowage_data": "${drop:path}/mnt/knowage_data",
            "logs": "${drop:path}/mnt/logs",
            "nginx": "${drop:path}/mnt/nginx",
            "dist": "${drop:path}/dist",
            "backup": "${drop:path}/mnt/backup",
            "certs": "${drop:path}/mnt/certs",
            "ldap": "${drop:path}/mnt/ldap",
            "ldap_data": "${drop.mounts:ldap}/ldap_data",
            "ldap_config": "${drop.mounts:ldap}/ldap_config",
            "ldap_connector": "${drop.mounts:ldap}/connector",
        },
        "drop.outputs": {
            "db_dockerfile": "${drop.mounts:dist}/db.Dockerfile",
            "docker-compose": "${drop.mounts:dist}/docker-compose.yml",
            "nginx_conf": "${drop.mounts:nginx}/default.conf",
            "env": "${drop.mounts:dist}/.env",
            "ldap-connector": "${drop.mounts:ldap_connector}/ldap.properties",
            "ldap-memberof-ldif": "${drop.mounts:dist}/config-memberof.ldif",
        },
        **default_secrets(),
    }


def default_secrets():
    """Returns a list of default secrets."""
    return {
        "secrets.db": {
            "name": "knowage",
            "user": "knowage",
            "pass": generate_random_secret(6),
        },
        "secrets.cache": {
            "user": "cache_user",
            "pass": generate_random_secret(6),
            "db_name": "knowage_cache",
        },
        "secrets": {
            "password_encryption_secret": generate_random_secret(32),
            "hmac_key": generate_random_secret(32),
            "cache_root_pass": generate_random_secret(6),
            "sensible_data_encryption_secret": generate_random_secret(64),
        },
        "secrets.ldap": {
            "admin_pass": generate_random_secret(6),
        },
    }


def get_number_input(prompt: str, default: int) -> int:
    """Prompts the user for a numeric input with a default value."""
    user_input = input(f"{prompt} (default: {default}):\n→ ").strip()
    if user_input == "":
        print(f"\033[F→ {default}\n")
    try:
        return int(user_input) if user_input else default
    except ValueError:
        print(f"Invalid input. Using default value: {default}\n")
        return default


def get_text_input(prompt: str, default: str) -> str:
    """Prompts the user for a text input with a default value, escaping single '$' for configparser."""
    user_input = input(f"{prompt.strip()} (default: {default}):\n→ ").strip()
    if user_input == "":
        final_value = default
        print(f"\033[F→ {default}\n")
    else:
        final_value = user_input
    if final_value:
        final_value = final_value.replace("$", "$$")

    return final_value


def get_optional_text_input(prompt: str, default: str | None = None) -> str | None:
    user_input = input(
        f"{prompt.strip()} (optional) {f'(default: {default.strip()})' if default else ''}:\n→ "
    ).strip()
    if user_input == "":
        final_value = default or None
        print(f"\033[F→ {final_value or '<empty>'}\n")
    else:
        final_value = user_input
    if final_value:
        final_value = final_value.replace("$", "$$")

    return final_value


def get_boolean_input(prompt: str, default: bool | None = None) -> str:
    """Prompts the user for a boolean input (yes/no) with a default value."""
    def_value = "y" if default else "n"
    user_input = (
        input(f"{prompt.strip()} (y/n, default: {def_value}):\n→ ").strip().lower()
    )
    if user_input == "":
        print(f"\033[F→ {def_value}\n")
    if user_input == "":
        return "1" if default is not None and default else "0"
    return "1" if user_input in ["y", "yes", "1", "true"] else "0"


def get_option_input(prompt: str, default: int, *options: str) -> int:
    """Prompts the user to select an option from a list with a default value."""
    print(f"{prompt.strip()} (default: {default})")
    for idx, option in enumerate(options, start=1):
        print(f"{idx}. {option}")
    user_input = input("→ ").strip()
    if user_input == "":
        print(f"\033[F→ {default}\n")
        return default
    try:
        int_val = int(user_input) if user_input else default
        if 1 <= int_val < len(options):
            return int_val
        else:
            print(f"Invalid input. Using default value: {default}\n")
            return default
    except ValueError:
        print(f"Invalid input. Using default value: {default}\n")
        return default


def get_user_input():
    global config
    drop = config["drop"]
    db_secrets = config["secrets.db"]
    ldap_secrets = config["secrets.ldap"]

    drop["path"] = get_text_input(
        "Enter the configuration path",
        drop.get("path", path.abspath(path.expanduser("~/.knowage"))),
    )
    if (
        drop["path"].startswith("~")
        or drop["path"].startswith("$")
        or drop["path"].startswith(".")
    ):
        drop["path"] = path.expanduser(drop["path"])
    drop["path"] = path.abspath(drop["path"])
    make_config_dirs(drop["path"])

    print("""
╔═══════════════════════════════════╗
║   ••• Gateway configuration •••   ║
╚═══════════════════════════════════╝
    """)
    gateway = config["gateway"]
    def_value = gateway.get("domain", "record.cm")
    gateway["domain"] = get_text_input("Enter your domain", def_value)

    gateway["proxy"] = get_boolean_input(
        "Is your deployment behind a reverse proxy?", gateway.getboolean("proxy", False)
    )

    if gateway.getboolean("proxy"):
        print("""
╔═════════════════════════════════╗
║   ••• Proxy configuration •••   ║
╚═════════════════════════════════╝
    """)
        config["gateway.nginx.ports"]["http"] = get_text_input(
            "Enter the port to use", config["gateway.nginx.ports"].get("http", "80")
        )

        config["gateway.nginx.https"]["enable"] = get_boolean_input(
            "Do you want to enable HTTPS?",
            config["gateway.nginx.https"].getboolean("enable", False),
        )

        if config["gateway.nginx.https"].getboolean("enable"):
            config["gateway.nginx.ports"]["https"] = get_text_input(
                "Enter the HTTPS port to use",
                config["gateway.nginx.ports"].get("https", "443"),
            )

        config["gateway.knowage"]["expose"] = get_boolean_input(
            "Do you want to expose Knowage to the host?",
            config["gateway.knowage"].getboolean("expose", False),
        )
        if config["gateway.knowage"].getboolean("expose"):
            print("""
╔═══════════════════════════════════╗
║   ••• Knowage configuration •••   ║
╚═══════════════════════════════════╝
    """)
            config["gateway.knowage"]["port"] = get_text_input(
                "Enter the port to expose Knowage",
                config["gateway.knowage"].get("port", "8080"),
            )
    else:
        print("""
╔═══════════════════════════════════╗
║   ••• Knowage configuration •••   ║
╚═══════════════════════════════════╝
    """)
        config["gateway.knowage"]["expose"] = "1"
        config["gateway.knowage"]["port"] = get_text_input(
            "Enter the port to expose Knowage",
            config["gateway.knowage"].get("port", "8080"),
        )
        config["gateway.knowage"]["sub_domain"] = get_text_input(
            "Enter the sub-domain for Knowage",
            config["gateway.knowage"].get("sub_domain", "knowage"),
        )

    def_value = "y" if config["advanced"].getboolean("modify") else "n"
    config["advanced"]["modify"] = get_boolean_input(
        "Do you want to modify advanced settings?", def_value == "y"
    )

    if config["advanced"].getboolean("modify"):
        print("""
╔═════════════════════════════════════════════════╗
║   ••• Database (PostgreSQL) Configuration •••   ║
╚═════════════════════════════════════════════════╝
    """)
        def_value = db_secrets.get("user", "knowage")
        db_secrets["user"] = get_text_input("Enter the database user name", def_value)

        def_value = db_secrets.get("pass", generate_random_secret(6))
        db_secrets["pass"] = get_text_input(
            "Enter the database user password", def_value
        )

        def_value = db_secrets.get("name", "knowage")
        db_secrets["name"] = get_text_input("Enter the database name", def_value)

        def_value = "y" if config["advanced.db"].getboolean("expose") else "n"
        config["advanced.db"]["expose"] = get_boolean_input(
            "Do you want to expose the database to the host?",
            def_value == "y",
        )

        if config["advanced.db"].getboolean("expose"):
            def_value = config["advanced.db"].get("port", "5432")
            config["advanced.db"]["port"] = get_text_input(
                "Enter the port to expose the database", def_value
            )
    # def_value = config["advanced.ldap"].getboolean("enable")
    # config["advanced.ldap"]["enable"] = get_boolean_input(
    #     "Do you want to enable LDAP containers for authentication?", def_value
    # )
    print("""
╔═════════════════════════════════════════════════════════════╗
║   ••• User & Identity Management Configuration (LDAP) •••   ║
╚═════════════════════════════════════════════════════════════╝
""")
    print("""
We use LDAP for user and identity management by default, an embedded LDAP server will be deployed alongside Knowage.
            """)
    def_value = "1" if config["advanced.ldap"].getboolean("enable", True) else "2"
    option = get_option_input(
        "Select LDAP workflow to use:",
        int(def_value),
        "Create LDAP containers (recommended)",
        "Use an existing LDAP server",
        "Don't use LDAP (Use knowage's internal authentication system)",
    )
    config["advanced.ldap"]["enable"] = "1" if option == 1 or option == 2 else "0"
    if option == 1:
        config["advanced.ldap"]["host"] = "ldap"
        config["advanced.ldap"]["deployment_type"] = "self-hosted"
        def_value = config["advanced.ldap"].getboolean("enable_tls")
        config["advanced.ldap"]["enable_tls"] = get_boolean_input(
            "Do you want to enable TLS for the LDAP server?", def_value
        )
        if config["advanced.ldap"].getboolean("enable_tls"):
            def_value = config["advanced.ldap"].get("ldaps_port", "636")
            config["advanced.ldap"]["ldaps_port"] = get_text_input(
                "Which port should the LDAP server listen on for LDAPS connections?",
                def_value,
            )
        else:
            def_value = config["advanced.ldap"].get("port", "389")
            config["advanced.ldap"]["port"] = get_text_input(
                "Which port should the LDAP server listen on for LDAP connections?",
                def_value,
            )
        def_value = (
            "1" if config["advanced.ldap.ui"].getboolean("enable", True) else "0"
        )
        config["advanced.ldap.ui"]["enable"] = get_boolean_input(
            "Do you want to enable the LDAP management UI?", def_value == "1"
        )
        if config["advanced.ldap.ui"].getboolean("enable"):
            def_value = config["advanced.ldap"].get("ui_port", "9090")
            config["advanced.ldap"]["ui_port"] = get_text_input(
                "Which port should be used for the LDAP management UI?", def_value
            )
    elif option == 2:
        config["advanced.ldap"]["deployment_type"] = "external"
        def_value = config["advanced.ldap"].get("host", "ldap.record.cm")
        config["advanced.ldap"]["host"] = get_text_input(
            "Enter the hostname or IP address of the existing LDAP server", def_value
        )
        def_value = config["advanced.ldap"].getboolean("enable_tls")
        config["advanced.ldap"]["enable_tls"] = get_boolean_input(
            "Is TLS enabled on your LDAP server?", def_value
        )
        def_value = (
            "1" if config["advanced.ldap.ui"].getboolean("enable", True) else "0"
        )
        config["advanced.ldap.ui"]["enable"] = get_boolean_input(
            "Do you want to enable the LDAP management UI?", def_value == "1"
        )
        if config["advanced.ldap.ui"].getboolean("enable"):
            def_value = config["advanced.ldap"].get("ui_port", "9090")
            config["advanced.ldap"]["ui_port"] = get_text_input(
                "Which port should be used for the LDAP management UI?", def_value
            )
    if option == 1 or option == 2:
        def_value = ldap_secrets.get("admin_pass", generate_random_secret(6))
        ldap_secrets["admin_pass"] = get_text_input(
            "Enter the LDAP admin password", def_value
        )
        def_value = config["ldap.dn"].get("prefix", "cn=")
        config["ldap.dn"]["prefix"] = get_text_input(
            "Enter the LDAP DN prefix", def_value
        )
        def_value = config["ldap.dn"].get("suffix", "")
        config["ldap.dn"]["suffix"] = (
            get_optional_text_input(
                "Enter the DN suffix (for knowage users)", def_value
            )
            or ""
        )
        def_value = config["ldap.dn"].get("base", "")
        config["ldap.dn"]["base"] = (
            get_optional_text_input("Enter the base DN", def_value) or ""
        )
        def_value = config["ldap.attrs"].get("role_name", "memberOf")
        config["ldap.attrs"]["role_name"] = get_text_input(
            "What LDAP attribute should be used to locate user roles?", def_value
        )
        def_value = config["ldap.attrs"].get("superuser", "cn")
        config["ldap.attrs"]["superuser"] = get_text_input(
            "What LDAP CN should be used for super users?", def_value
        )
        # def_value = config["ldap.filters"].get(
        #     "auth", "(&(enabled=true)(!deprecated=true))"
        # )
        # config["ldap.filters"]["auth"] = get_text_input(
        #     "What LDAP filter should be used to search for users during authentication with Knowage",
        #     def_value,
        # )
        # def_value = config["ldap.filters"].get(
        #     "user_search", "(&(objectclass=posixAccount)(uid=%s))"
        # )
        # config["ldap.filters"]["user_serach"] = get_text_input(
        #     "What LDAP filter should be used to search for users", def_value
        # )
    else:
        config["advanced.ldap"]["deployment_type"] = "none"


def store_updated_config():
    """Stores the updated configuration back to the config file."""
    global config
    print(f"Storing {'updated ' if not is_first_run else ''}configuration...")
    cache_dir = path.abspath(path.expanduser("~/.cache/knowage"))

    temp = config_to_dict(False)

    config.remove_section("secrets.db")
    config.remove_section("secrets.cache")
    config.remove_section("secrets")
    config.remove_section("status")
    config.remove_section("secrets.ldap")
    makedirs(cache_dir, exist_ok=True)
    config_file = path.join(cache_dir, "config.ini")
    with open(config_file, "w") as f:
        config.write(f)
    if args.verbose:
        print(f"Configuration saved to '{config_file}'")
    config.read_dict(temp)


def write_banner():
    print("""
╔════════════════════════════════════════════════════════╗
║   ••• Welcome to the Knowage Installation Setup! •••   ║
╚════════════════════════════════════════════════════════╝
    """)


def copy_artifacts():
    """Copies necessary artifacts to the distribution directory."""
    print("Copying artifacts...")
    global config
    dist_dir = config["drop.mounts"].get("backup", "backup")
    makedirs(dist_dir, exist_ok=True)
    artifact_names = [
        {"input": path.join("out", "2.data.sql"), "output": "2.data.sql"},
        {"input": path.join("out", "1.tables.sql"), "output": "1.tables.sql"},
        {"input": path.join("out", "caskeystore.jks"), "output": "cas/caskeystore.jks"},
    ]

    for artifact_ref in artifact_names:
        src_path = path.join(getcwd(), artifact_ref["input"])
        dest_path = path.join(dist_dir, artifact_ref["output"])
        if path.exists(src_path):
            makedirs(path.dirname(dest_path), exist_ok=True)
            with open(src_path, "rb") as src_file:
                written_bytes = 0
                with open(dest_path, "wb") as dest_file:
                    written_bytes += dest_file.write(src_file.read())
                if args.verbose:
                    print(
                        f"[COPY] {(written_bytes / 1_000_000):.2f} MB → '{dest_path}' successfully"
                    )
            if args.verbose:
                print(f"Copied '{src_path}' → '{dest_path}'")
        else:
            print(
                f"Warning: Artifact '{src_path}' does not exist and cannot be copied."
            )


def start_deployment():
    """Performs the deployment using Docker Compose."""
    print("Starting deployment...")
    if not is_docker_running():
        print(
            "Error: Docker is not running. Please start Docker and try again.",
            file=sys.stderr,
        )
        exit(10)
        return
    global config
    compose_file = config["drop.outputs"].get("docker-compose")
    if not compose_file:
        print("Error: Docker Compose file path is not set in the configuration.")
        exit(10)
        return
    env_file = config["drop.outputs"].get("env")
    if not env_file:
        print("Error: Environment file path is not set in the configuration.")
        exit(10)
        return
    if not path.exists(compose_file):
        print(f"Error: Docker Compose file '{compose_file}' does not exist.")
        exit(10)
        return
    if not path.exists(env_file):
        print(f"Error: Environment file '{env_file}' does not exist.")
        exit(10)
        return

    import subprocess

    try:
        command_args = [
            "docker-compose",
            "-p",
            str(args.project_name).lower(),
            "-f",
            compose_file,
            "--env-file",
            env_file,
            "up",
            "-d",
        ]
        print("Bringing up the new deployment...")
        subprocess.run(
            command_args,
            check=True,
        )
        print("Deployment completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error during deployment: {e}")


def stop_deployment(remove_containers: bool = False, remove_volumes: bool = False):
    """Stops any existing deployment using Docker Compose."""
    print("Stopping existing deployment if any...")

    if not is_docker_running():
        print("Docker is not running. Skipping stop.", file=sys.stderr)
        exit(10)
        return
    global config
    compose_file = config["drop.outputs"].get("docker-compose")
    if not compose_file:
        print("Error: Docker Compose file path is not set in the configuration.")
        exit(10)
        return
    env_file = config["drop.outputs"].get("env")
    if not env_file:
        print("Error: Environment file path is not set in the configuration.")
        exit(10)
        return
    if not path.exists(compose_file):
        print(
            f"Warning: Docker Compose file '{compose_file}' does not exist. Skipping stop."
        )
        return
    if not path.exists(env_file):
        print(f"Warning: Environment file '{env_file}' does not exist. Skipping stop.")
        return

    import subprocess

    try:
        command_args = [
            "docker-compose",
            "-p",
            str(args.project_name).lower(),
            "-f",
            compose_file,
            "--env-file",
            env_file,
        ]
        command_args.append("stop")
        subprocess.run(
            command_args,
            check=True,
        )
        print("Existing deployment stopped successfully.")

        if remove_volumes and remove_containers:
            print(
                "WARNING: -c flag enabled. This will remove all existing containers, as well volumes being used.\nThis process cannot be undone and data will be lost",
            )
            choice = get_boolean_input("Are you sure you want to proceed?", False)
            if choice:
                command_args = [
                    "docker-compose",
                    "-p",
                    str(args.project_name).lower(),
                    "-f",
                    compose_file,
                    "rm",
                    "--force",
                ]
                if remove_volumes:
                    command_args.append("-v")
                subprocess.run(command_args, check=True)
                print("Existing deployment removed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error while stopping existing deployment: {e.stderr}")
        exit(10)
        return


def set_config_to_default():
    global config
    config.read_dict(default_config())


def clear_stored_config():
    """Clears the stored configuration file."""
    global is_first_run
    cache_dir = path.abspath(path.expanduser("~/.cache/knowage"))
    config_file = path.join(cache_dir, "config.ini")
    if path.exists(config_file):
        try:
            import os

            os.remove(config_file)
            is_first_run = True
            if args.verbose:
                print(f"Removed existing configuration file: {config_file}")
        except OSError as e:
            print(f"Error removing configuration file: {e}")
    else:
        if args.verbose:
            print(f"No existing configuration file to remove at: {config_file}")


def clear_current_deployment():
    global config
    print(f"Clearing current deployment at: {config['drop'].get('path', 'unknown')}")
    target_dir = config["drop"].get("path")
    if target_dir is None or not path.exists(target_dir):
        print("There is no current deployment. skipping")
        return
    try:
        from shutil import rmtree

        rmtree(target_dir)
    except OSError as e:
        print(f"Error while removing: {target_dir}: {e.strerror}")


def is_docker_running():
    """Checks if Docker is running."""
    import subprocess

    try:
        subprocess.run(
            ["docker", "info"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return True
    except subprocess.CalledProcessError:
        return False
    except FileNotFoundError:
        return False


def show_deployment_summary():
    """Displays a summary of the current deployment's configuration."""
    global config


def install():
    deployment_is_running = True
    load_existing_config(load_new_secrets=args.force_config or args.clean_install)
    if args.clean_install:
        stop_deployment(True, True)
        clear_current_deployment()
        set_config_to_default()
        clear_stored_config()
        deployment_is_running = False
    if args.stop and not args.clean_install:
        stop_deployment()
        if args.stop:
            return
    if (
        args.force_config
        or is_first_run
        or not config.getboolean("status", "configured", fallback=False)
    ):
        write_banner()
        get_user_input()
        fix_paths()
        store_updated_config()
    process_templates()
    if args.force_config or args.clean_install:
        copy_artifacts()
    if deployment_is_running:
        stop_deployment(
            remove_containers=args.clean_install,
            remove_volumes=(args.clean_install and args.force_config) or is_first_run,
        )
    start_deployment()
    show_deployment_summary()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Knowage Installation Script",
        epilog="Generates configuration files and sets up Knowage using Docker Compose.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-f",
        "--force_config",
        action="store_true",
        help="Force reconfiguration even if already configured.",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output."
    )
    parser.add_argument(
        "--fresh_deploy",
        action="store_true",
        help="Delete existing deployment and re-deploy (this does not install anew)",
    )
    parser.add_argument(
        "-s", "--stop", action="store_true", help="Stop existing deployment and exit"
    )
    parser.add_argument(
        "-c",
        "--clean-install",
        action="store_true",
        help="Forecefully installs a new configuration (deletes existing config and secrets)",
    )
    parser.add_argument(
        "-p",
        "--project-name",
        type=str,
        default="Record",
        help="Sets the Docker Compose project name.",
    )
    args = parser.parse_args()
    install()
