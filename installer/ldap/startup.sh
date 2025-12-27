#!/bin/bash
set -e

# 1. Start temporary slapd pointing to the existing config directory
/usr/sbin/slapd -h "ldapi:///" -F /etc/ldap/slapd.d -u openldap -g openldap &
SLAPD_PID=$!

# 2. Wait for the temporary server
RETRIES=15
while [ $RETRIES -gt 0 ]; do
    if ldapsearch -Q -LLL -Y EXTERNAL -H ldapi:/// -s base >/dev/null 2>&1; then
        break
    fi
    echo "Waiting for temporary LDAP..."
    sleep 1
    RETRIES=$((RETRIES-1))
done

# 3. Apply the configuration (Adding module and overlays)
ldapmodify -Q -Y EXTERNAL -H ldapi:/// <<EOF
dn: cn=module{0},cn=config
changetype: modify
add: olcModuleLoad
olcModuleLoad: ppolicy.la

dn: olcOverlay=memberof,olcDatabase={1}mdb,cn=config
changetype: add
objectClass: olcMemberOf
objectClass: olcOverlayConfig
olcOverlay: memberof
olcMemberOfRefInt: TRUE
olcMemberOfGroupOC: groupOfNames
olcMemberOfMemberAD: member
olcMemberOfMemberOfAD: memberOf

dn: olcOverlay=refint,olcDatabase={1}mdb,cn=config
changetype: add
objectClass: olcRefintConfig
objectClass: olcOverlayConfig
olcOverlay: refint
olcRefintAttribute: member

dn: olcOverlay=ppolicy,olcDatabase={1}mdb,cn=config
changetype: add
objectClass: olcPPolicyConfig
objectClass: olcOverlayConfig
olcOverlay: ppolicy
olcPPolicyHashCleartext: TRUE
EOF

# 4. Shutdown temporary server
kill $SLAPD_PID
wait $SLAPD_PID || true

echo "Configuration applied."