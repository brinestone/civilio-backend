# Documentation
This project contains code for the API Server. It facilitates the
data synchronization between Knowage and LDAP and stands as an Identity provider for the deployment

## Deployment
To deploy the server, you can do it in two ways.
- Docker (Recommended)

### Docker Deployment
In this guide we deploy the server as a Docker
#### Prerequisites
The following technologies are required for this deployment
- Docker

### How to Deploy
- Standalone deployment
Run the following in your terminal window
```bash
docker run --name civilio-server \
      -p 3000:3000/tcp \
      -p 5534:5534/udp \
      -e NITRO_PORT=3000
      -e NITIRO_DATABASE_URL="postgresql://<database_user>:<database_password>@<database_server>:<database_port>/<database_name>" \
      -e NITRO_PUBLIC_ADDRESS="http://localhost:3000/api" \
      ghcr.io/brinestone/civilio/civilio-backend:latest
```