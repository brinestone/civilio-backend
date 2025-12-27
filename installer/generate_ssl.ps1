# Set-ExecutionPolicy Unrestricted -Scope Process -Force
# NOTE: This script requires OpenSSL to be installed and available in your PATH.

# --- IMPORTANT ---
# Replace these with the hostnames you intend to use for your services.
# In a real environment, you would use a commercially signed certificate.
$LDAP_HOSTNAME = "ldap.brinestone.tech"
$BI_HOSTNAME = "bi.brinestone.tech"
$KNOWLEDGE_HOSTNAME = "knowage.brinestone.tech" # <--- ADDED THE KNOWAGE HOSTNAME HERE
# -----------------

# Define the output directory
$OUTPUT_DIR = "./nginx"

# Define file paths
$OPENSSL_CONFIG = Join-Path $OUTPUT_DIR "openssl.cnf"
$PRIVATE_KEY = Join-Path $OUTPUT_DIR "privkey.pem"
$FULL_CHAIN = Join-Path $OUTPUT_DIR "fullchain.pem"

# Ensure the output directory exists
Write-Host "Ensuring output directory $OUTPUT_DIR exists..."
If (-Not (Test-Path $OUTPUT_DIR)) {
    New-Item -Path $OUTPUT_DIR -ItemType Directory -Force | Out-Null
}

# 1. Create a Configuration File (SANs - Subject Alternative Names)
Write-Host "Creating OpenSSL configuration file..."

# PowerShell multi-line string for the configuration
$ConfigContent = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
# Common Name (CN) is set to the primary host (LDAP)
commonName = $LDAP_HOSTNAME

[req_distinguished_name]
C = CM
ST = Bastos
L = Yaounde
O = BUNEC
OU = IT
CN = $LDAP_HOSTNAME

[v3_req]
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
# List all hostnames the certificate should cover
DNS.1 = $LDAP_HOSTNAME
DNS.2 = $BI_HOSTNAME
DNS.3 = $KNOWLEDGE_HOSTNAME # <--- ADDED THE KNOWAGE HOSTNAME TO SAN LIST
"@

# Write the content to the configuration file
$ConfigContent | Out-File -FilePath $OPENSSL_CONFIG -Encoding ASCII

# 2. Generate the Private Key and Self-Signed Certificate
Write-Host "Generating private key ($PRIVATE_KEY) and certificate ($FULL_CHAIN)..."

# Check if OpenSSL is available before attempting execution
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    Write-Error "OpenSSL command not found. Please ensure OpenSSL is installed and in your system PATH."
    exit 1
}

# Execute OpenSSL command
& openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $PRIVATE_KEY -out $FULL_CHAIN -config $OPENSSL_CONFIG

# Check for successful execution
if ($LASTEXITCODE -ne 0) {
    Write-Error "OpenSSL execution failed. Check console output for errors."
}

# 3. Clean up the temporary config file
Write-Host "Cleaning up temporary configuration file..."
Remove-Item -Path $OPENSSL_CONFIG -Force | Out-Null

Write-Host "--------------------------------------------------------"
Write-Host "✅ Self-Signed SSL files created successfully in $OUTPUT_DIR/"
Write-Host "   - Certificate: fullchain.pem"
Write-Host "   - Private Key: privkey.pem"
Write-Host "   - Remember to map your hostnames (e.g., ldap.brinestone.tech) to 127.0.0.1 in your local hosts file!"
Write-Host "--------------------------------------------------------"