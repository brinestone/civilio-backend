from re import fullmatch
from os import path, environ
from pathlib import Path
from platform import system
from argparse import ArgumentParser
from copy import deepcopy
import subprocess
from random import choice

def uniqueCode(len=8):
    ALPHABET=list('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&*$*0)-(=-')
    ans = ''
    for _ in range(len):
        ans = ans + choice(ALPHABET)
    return ans

homedir=environ['HOME'] if system() != "Windows" else environ['USERPROFILE']
configDir=path.join(homedir, '.civilio')
config_file = path.join(configDir, 'config')
verbose=False
is_first_time=True
forceMode=True # TODO: set to False in production
config={}
targetVersion='1.0.0'

# Config keys
NGINX_CONFIG_PATH="nginx-config-path"
NGINX_CONFIG_DIR="nginx-config-dir"
ADMIN_EMAIL="admin-email"
ADMIN_NAMES="admin-names"
ADMIN_PASSWORD="admin-password"
API_CONTAINER_PORT="api-port"
ENABLE_BACKUP="enable-backup"
BACKUP_DIR="backup-dir"
DB_PORT="db-port"
DB_SERVICE_NAME='db-service-name'
HASURA_CONNECTOR_PORT='hasura-connector-port'
AUTH_CONTAINER_PORT='auth-container-port'
DB_AUTHORIZATION_HEADER_TOKEN='db-authorization-header-token'
AUTH_SERVICE_NAME='auth-service-name'
HASURA_API_SERVICE_NAME='hasura-api-service-name'
JWT_SECRET='jwt-secret'
HASURA_SERVICE_TOKEN_SECRET='hasura-service-token-secret'
OTEL_EXPORTER_OTLP_PORT='otel-exporter-otlp-endpoint'
DB_PASSWORD='database-password'
DB_USER='database-user'
DB_NAME='database-name'

prompts = {
    ADMIN_NAMES: "Enter the administrator name",
    ADMIN_EMAIL: "Enter the administrator email",
    ADMIN_PASSWORD: "Enter the administrator password",
    API_CONTAINER_PORT: "What TCP port should be used for the API?",
    ENABLE_BACKUP: "Do you want to configure data backups?",
    # BACKUP_DIR: "Where do you want your database backups to be stored?",
}

options = {
    ENABLE_BACKUP: {True: 'Yes', False: 'No'}
}

defaultConfig = {
    ADMIN_NAMES: "Administrator",
    ADMIN_PASSWORD: uniqueCode(10),
    API_CONTAINER_PORT: '9000',
    DB_PORT: '5432',
    HASURA_CONNECTOR_PORT: '9367',
    AUTH_CONTAINER_PORT: '9500',
    ENABLE_BACKUP: True,
    BACKUP_DIR: path.join(configDir, 'data-backup'),
    DB_AUTHORIZATION_HEADER_TOKEN: uniqueCode(20).encode('ascii'),
    DB_SERVICE_NAME: 'db',
    HASURA_API_SERVICE_NAME: 'api',
    AUTH_SERVICE_NAME: 'auth',
    JWT_SECRET: uniqueCode(32).encode('ascii'),
    HASURA_SERVICE_TOKEN_SECRET: uniqueCode(32).encode('ascii'),
    OTEL_EXPORTER_OTLP_PORT: '4317',
    DB_NAME: 'civilio',
    DB_USER: 'civilio',
    DB_PASSWORD: uniqueCode(10),
    NGINX_CONFIG_PATH: path.join(configDir, 'nginx','nginx.conf'),
    NGINX_CONFIG_DIR: path.join(configDir, 'nginx')
}

current_config = deepcopy(defaultConfig)

def is_current_config_default():
    ans = True
    sameLength = len(defaultConfig) == len(current_config)
    if sameLength:
        for key in defaultConfig:
            if defaultConfig[key] != current_config.get(key):
                ans = False
                break
    return ans

def write_config():
    try:
        with open(config_file, "w") as f:
            for k,v in config.items():
                f.write(f'{k}={v}\n')
    except FileNotFoundError:
        dir = Path(path.dirname(config_file))
        dir.mkdir(parents=True, exist_ok=True)
        return write_config()
    except IOError as e:
        print(e)
        exit(2)

def parse_args():
    parser = ArgumentParser(
        prog='CivilIO',
        description='CivilIO API Installer'
    )
    parser.add_argument('-v', '--verbose', action="store_true")
    parser.add_argument('-f', '--force', action="store_true")
    args = parser.parse_args()

    global verbose
    global forceMode
    forceMode = args.force
    verbose = args.verbose

def collect_option(Prompt, Default=None, Ordinal=None, Options=None, Validator=lambda val: None):
    ordinal = (str(Ordinal) + '.') if Ordinal != None else ''
    defV = '' if Default == None else str(Default)
    question = f'{ordinal} {Prompt} [{defV}]:'.lstrip(' ')
    valid = False
    if Options != None:
        optionsStr = ''
        i = 1
        for _,v in dict(Options).items():
            optionsStr += f'[{i}] {v}\n'
            i=i+1
        response = str(1)
        question = f'{ordinal} {Prompt} [{response}]:'.lstrip(' ')
        while not valid:
            response = input(f'{question}\n{optionsStr}')
            if response == '':
                valid = True
                response = str(1)
                break
            else:
                try:
                    if not fullmatch(r'^\d+$', response):
                        print(red('Invalid input. Try that again.'))
                        continue

                    temp = Options[list(dict(Options).keys())[int(response)-1]]
                    if (int(response) > len(dict(Options).items()) and int(response) < len(dict(Options).items())) or Validator(temp) != None:
                        print(red('Invalid option. Try that again.'))
                    else:
                        valid = True
                except IndexError:
                    print(red('Invalid option. Try that again.'))
        value = list(Options.keys())[int(response)-1]
        return value
    else:
        while not valid:
            value = input(question)
            if len(value) == 0:
                return Default
            else:
                v = Validator(value)
                if v != None:
                    print(red(f'{str(v)}. Try again'))
                    continue
                return value

def collect_options():
    global current_config
    promptCounter = 1
    current_config[ADMIN_NAMES] = collect_option(prompts[ADMIN_NAMES], config.get(ADMIN_NAMES, defaultConfig.get(ADMIN_NAMES)), promptCounter)

    promptCounter += 1
    emailRegex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    current_config[ADMIN_EMAIL] = collect_option(
        prompts[ADMIN_EMAIL],
        config.get(ADMIN_EMAIL, defaultConfig.get(ADMIN_EMAIL)),
        promptCounter,
        Validator=lambda email: None if fullmatch(emailRegex, str(email).strip()) else "Invalid email format"
    )

    promptCounter += 1
    current_config[ADMIN_PASSWORD] = collect_option(
        prompts[ADMIN_PASSWORD], 
        config.get(ADMIN_PASSWORD, defaultConfig.get(ADMIN_PASSWORD)), 
        promptCounter, 
        Validator=lambda password: None if len(str(password).strip()) > 6 else "Password is too short. Please enter at least 6 characters"
    )

    promptCounter += 1
    portRegex = r'^\d{4,5}$'
    current_config[API_CONTAINER_PORT] = collect_option(
        prompts[API_CONTAINER_PORT],
        config.get(API_CONTAINER_PORT, defaultConfig.get(API_CONTAINER_PORT)),
        promptCounter,
        Validator=lambda port: None if fullmatch(portRegex, str(port).strip()) and int(port) > 1024 and int(port) <= 65_535 else "Invalid port number. It must be between 1025-65535"
    )

    promptCounter += 1
    current_config[ENABLE_BACKUP] = collect_option(
        prompts[ENABLE_BACKUP],
        config.get(ENABLE_BACKUP, defaultConfig.get(ENABLE_BACKUP)),
        promptCounter,
        options.get(ENABLE_BACKUP)
    )

def write_templated_files():
    envTemplate = f"""
API_DB_AUTHORIZATION_HEADER="Bearer @@{DB_AUTHORIZATION_HEADER_TOKEN}"
API_DB_CONNECTION_URI="postgres://@@{DB_USER}:@@{DB_PASSWORD}@@@{DB_SERVICE_NAME}:@@{DB_PORT}/@@{DB_NAME}"
API_DB_HASURA_CONNECTOR_PORT=@@{HASURA_CONNECTOR_PORT}
API_DB_HASURA_SERVICE_TOKEN_SECRET="@@{HASURA_SERVICE_TOKEN_SECRET}"
API_DB_OTEL_EXPORTER_OTLP_ENDPOINT="http://local.hasura.dev:@@{OTEL_EXPORTER_OTLP_PORT}"
API_DB_OTEL_SERVICE_NAME="@@{HASURA_API_SERVICE_NAME}"
API_DB_READ_URL="http://local.hasura.dev:@@{HASURA_CONNECTOR_PORT}"
API_DB_WRITE_URL="http://local.hasura.dev:@@{HASURA_CONNECTOR_PORT}"
IDENTITY_SERVICE_WEBHOOK_URL="http://@@{AUTH_SERVICE_NAME}:@@{AUTH_CONTAINER_PORT}/api/hasura/session"
JWT_SECRET="@@{JWT_SECRET}"
    """

    composeTemplate=f"""
services:
    @@{HASURA_API_SERVICE_NAME}:
        image: brinestone/civilio-api:{targetVersion}
        depends_on:
            - @@{DB_SERVICE_NAME}
        env_file:
            - .env
        environment:
            CONNECTION_URI: $API_DB_CONNECTION_URI
            HASURA_SERVICE_TOKEN_SECRET: $API_DB_HASURA_SERVICE_TOKEN_SECRET
            OTEL_EXPORTER_OTLP_ENDPOINT: $API_DB_OTEL_EXPORTER_OTLP_ENDPOINT
            OTEL_SERVICE_NAME: $API_DB_OTEL_SERVICE_NAME
        extra_hosts:
            - local.hasura.dev:host-gateway
    
    @@{DB_SERVICE_NAME}:
        image: brinestone/civilio-db:{targetVersion}
        restart: always
        environment:
            POSTGRES_PASSWORD: @@{DB_PASSWORD}
            POSTGRES_DB: @@{DB_NAME}
            POSTGRES_USER: @@{DB_USER}
        healthcheck:
            test: ["CMD", "pg_isready", "-U", "@@{DB_USER}"]
            interval: 10s
            timeout: 5s
            retries: 5
    @@{AUTH_SERVICE_NAME}:
        image: brinestone/civilio-auth:{targetVersion}
        restart: unless-stopped
        depends_on:
            - db
        environment:
            PORT:@@{DB_PORT}
            DB_URL: "postgres://@@{DB_USER}:@@{DB_PASSWORD}@@@{DB_SERVICE_NAME}:@@{DB_PORT}/@@{DB_NAME}"
            BETTER_AUTH_SECRET: "@@{JWT_SECRET}"
            BETTER_AUTH_URL: "http://localhost:@@{DB_PORT}"
            ADMIN_NAME: "@@{ADMIN_NAMES}"
            ADMIN_EMAIL: "@@{ADMIN_EMAIL}"
            ADMIN_PASSWORD: "@@{ADMIN_PASSWORD}"

    engine:
        depends_on:
            - @@{DB_SERVICE_NAME}
            - @@{AUTH_SERVICE_NAME}
        image: brinestone/civilio-engine:{targetVersion}
        restart: unless-stopped
        environment:
            IDENTITY_SERVICE_WEBHOOK_URL: http://@@{AUTH_SERVICE_NAME}:@@{AUTH_CONTAINER_PORT}/api/hasura/session
            AUTHN_CONFIG_PATH: /md/auth_config.json
            ENABLE_CORS: 'true'
            ENABLE_SQL_INTERFACE: 'true'
            INTROSPECTION_METADATA_FILE: /md/metadata.json
            METADATA_PATH: /md/open_dd.json
            OLTP_ENDPOINT: http://local.hasura.dev:@@{OTEL_EXPORTER_OTLP_PORT}
        extra_hosts:
            - local.hasura.dev:host-gateway
        labels:
            io.hasura.ddn.service-name: engine

    otel-collector:
        command:
            - --config=/etc/otel-collector-config.yaml
        environment:
            HASURA_DDN_PAT: ${{HASURA_DDN_PAT}}
        image: otel/opentelemetry-collector:0.104.0
        volumes:
            - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml

    gateway:
        image: nginx:stable-perl
        restart: unless-stopped
        depends_on:
            - @@{HASURA_API_SERVICE_NAME}
            - @@{AUTH_SERVICE_NAME}
        ports:
            - @@{API_CONTAINER_PORT}:80
        volumes:
            - @@{NGINX_CONFIG_PATH}:/etc/nginx/nginx.conf:ro
            - @@{NGINX_CONFIG_DIR}/logs:/var/log/nginx:rw
    """

    nginxTemplate = f"""
worker_processes auto;
events {{
    worker_connections 1024;
}}

http {{
    include mime.types;
    upstream auth_service {{
        server @@{AUTH_SERVICE_NAME}:@@{AUTH_CONTAINER_PORT};
    }}

    upstream api_service {{
        server @@{HASURA_API_SERVICE_NAME}:@@{API_CONTAINER_PORT};
    }}

    server {{
        listen 80;
        listen [::]:80;

        location /identity {{
            rewrite ^/identity/(.*)$ /api/$1 break;
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }}

        location / {{
            proxy_pass http://api_service;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }}

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;
    }}
}}
    """

    composeFilePath = path.join(configDir, 'docker-compose.yml')
    nginxFilePath = path.join(current_config[NGINX_CONFIG_DIR], 'nginx.conf')
    envFilePath = path.join(configDir, '.env')
    nginxLogsDir = path.join(current_config[NGINX_CONFIG_DIR], 'logs')
    if not path.exists(nginxLogsDir):
        Path(nginxLogsDir).mkdir(parents=True, exist_ok=True)

    for key in list(current_config.keys()):
        composeTemplate = composeTemplate.replace(f'@@{key}', str(current_config[key]))
        nginxTemplate = nginxTemplate.replace(f'@@{key}', str(current_config[key]))
        envTemplate = envTemplate.replace(f'@@{key}', str(current_config[key]))

    for [file, content] in [
        [composeFilePath, composeTemplate], 
        [nginxFilePath,  nginxTemplate], 
        [envFilePath, envTemplate]]:
        dir = Path(path.dirname(file))
        if not dir.exists():
            dir.mkdir(parents=True, exist_ok=True)
        with open(file, 'w') as handle:
            handle.write(content);

def start_environment(Force=False):
    print('Starting environment')
    cmd = ['docker-compose', '-p', 'civilio', '-f', path.join(configDir, 'docker-compose.yml'), 'up', '--remove-orphans', '-d']
    if Force:
        cmd.append('--force-recreate')
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in iter(process.stdout.readline, ''):
            print(line, end='')
        process.stdout.close()
        process.wait()
        print('Environment started successfully')
    except KeyboardInterrupt:
        print('Interrupted by user')

def pull_files():
    print('Pulling files')
    cloneDir = path.join(configDir, 'drop')
    cmd = ['git', 'clone', 'https://gitub.com/brinestone/civilio.git', configDir]

def run(Setup=False):
    if Setup:
        print('Initializing configuration...')
        collect_options()
        pull_files()
        write_templated_files()
        load_config()
    print(current_config)
    start_environment(Force=Setup)

def red(text):
    return f'\033[31m{text}\033[0m'

def load_config():
    global current_config
    global is_first_time
    try:
        with open(config_file, 'r') as handle:
            for line in handle:
                k,v = line.split('=')[0], line.split('=')[1].rstrip()
                if v == 'None':
                    current_config[k]=None
                else:
                    current_config[k]=v
            is_first_time=False
    except IOError:
        is_first_time=True

def main():
    load_config()
    parse_args()
    run(Setup=bool(forceMode) or is_first_time)
    if not is_current_config_default():
        write_config()

if __name__ == '__main__':
    main()