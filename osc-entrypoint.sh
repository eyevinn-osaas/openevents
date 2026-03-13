#!/bin/bash
# Note: This script requires bash for regex matching and BASH_REMATCH array support
set -e

# Database URL Parsing - Parse single DATABASE_URL into component variables
if [ -n "$DATABASE_URL" ]; then
  echo "Parsing DATABASE_URL into component environment variables..."
  
  # Parse the database URL using regex patterns
  if [[ "$DATABASE_URL" =~ ^([^:]+)://([^:]*):?([^@]*)@([^:]+):([0-9]+)/?(.*)$ ]]; then
    DB_SCHEME="${BASH_REMATCH[1]}"
    DB_USER="${BASH_REMATCH[2]}"
    DB_PASS="${BASH_REMATCH[3]}"
    DB_HOST="${BASH_REMATCH[4]}"
    DB_PORT="${BASH_REMATCH[5]}"
    DB_NAME="${BASH_REMATCH[6]}"
    
    # Export standard database environment variables
    export DB_HOST="$DB_HOST"
    export DB_PORT="$DB_PORT"
    export DB_USER="$DB_USER"
    export DB_PASSWORD="$DB_PASS"
    export DB_NAME="$DB_NAME"
    
    echo "Set DB_HOST=$DB_HOST"
    echo "Set DB_PORT=$DB_PORT"
    echo "Set DB_USER=$DB_USER"
    echo "Set DB_PASSWORD=[REDACTED]"
    echo "Set DB_NAME=$DB_NAME"
    
    # Set database-type specific variables based on scheme
    case "$DB_SCHEME" in
      "postgresql"|"postgres")
        export PGHOST="$DB_HOST"
        export PGPORT="$DB_PORT"
        export PGUSER="$DB_USER"
        export PGPASSWORD="$DB_PASS"
        export PGDATABASE="$DB_NAME"
        export POSTGRES_URL="$DATABASE_URL"
        echo "Set PostgreSQL-specific environment variables"
        ;;
      "mysql")
        export MYSQL_HOST="$DB_HOST"
        export MYSQL_PORT="$DB_PORT"
        export MYSQL_USER="$DB_USER"
        export MYSQL_PASSWORD="$DB_PASS"
        export MYSQL_DATABASE="$DB_NAME"
        export MYSQL_URL="$DATABASE_URL"
        echo "Set MySQL-specific environment variables"
        ;;
      "mariadb")
        export MARIADB_HOST="$DB_HOST"
        export MARIADB_PORT="$DB_PORT"
        export MARIADB_USER="$DB_USER"
        export MARIADB_PASSWORD="$DB_PASS"
        export MARIADB_DATABASE="$DB_NAME"
        export MARIADB_URL="$DATABASE_URL"
        # Also set MySQL vars for compatibility
        export MYSQL_HOST="$DB_HOST"
        export MYSQL_PORT="$DB_PORT"
        export MYSQL_USER="$DB_USER"
        export MYSQL_PASSWORD="$DB_PASS"
        export MYSQL_DATABASE="$DB_NAME"
        export MYSQL_URL="$DATABASE_URL"
        echo "Set MariaDB-specific environment variables"
        ;;
      "redis")
        export REDIS_HOST="$DB_HOST"
        export REDIS_PORT="$DB_PORT"
        export REDIS_URL="$DATABASE_URL"
        # Also set Valkey vars since OSC uses Valkey
        export VALKEY_URL="$DATABASE_URL"
        echo "Set Redis-specific environment variables"
        ;;
      "mongodb")
        export MONGO_URL="$DATABASE_URL"
        export MONGODB_URI="$DATABASE_URL"
        # Also set CouchDB vars since OSC uses CouchDB for document storage
        export COUCHDB_URL="$DATABASE_URL"
        echo "Set MongoDB-specific environment variables"
        ;;
      *)
        echo "Unknown database scheme: $DB_SCHEME, using generic variables only"
        ;;
    esac
  else
    echo "Warning: Could not parse DATABASE_URL format"
  fi
else
  echo "No DATABASE_URL provided, skipping database variable setup"
fi

# OSC Public URL Configuration
if [ -n "$OSC_HOSTNAME" ]; then
  export PUBLIC_URL="https://$OSC_HOSTNAME"
  echo "Setting PUBLIC_URL to: $PUBLIC_URL"
  
  export NEXTAUTH_URL="$PUBLIC_URL"
  echo "Set NEXTAUTH_URL to: $PUBLIC_URL"
else
  echo "OSC_HOSTNAME not set, using default configuration"
fi

# Persistent Storage Path Configuration
echo "Configuring persistent storage paths..."
export UPLOAD_DIR="/data/uploads"
echo "Set UPLOAD_DIR to: /data/uploads"
export CACHE_DIR="/data/cache"
echo "Set CACHE_DIR to: /data/cache"
export DATABASE_URL="configured to use persistent PostgreSQL instance"
echo "Set DATABASE_URL to: configured to use persistent PostgreSQL instance"

# Enhanced Configuration File Generation
echo "Generating configuration files from environment variables..."

# Generate .env (env format)
echo "Generating .env..."
cat > ".env" << 'EOF'
# Generated environment configuration
APP_ENVIRONMENT=\$\{NODE_ENV:-development\}
APP_PUBLICURL=\$\{NEXT_PUBLIC_APP_URL:-http://localhost:3000\}
APP_NAME=\$\{APP_NAME:-OpenEvents\}
APP_DEFAULTCURRENCY=\$\{DEFAULT_CURRENCY:-USD\}
DATABASE_URL=\$\{DATABASE_URL:-\}
AUTH_SECRET=\$\{NEXTAUTH_SECRET:-\}
AUTH_URL=\$\{NEXTAUTH_URL:-http://localhost:3000\}
STORAGE_S3_ENDPOINT=\$\{S3_ENDPOINT:-\}
STORAGE_S3_PUBLICURL=\$\{S3_PUBLIC_URL:-\}
STORAGE_S3_ACCESSKEYID=\$\{S3_ACCESS_KEY_ID:-\}
STORAGE_S3_SECRETACCESSKEY=\$\{S3_SECRET_ACCESS_KEY:-\}
STORAGE_S3_BUCKETNAME=\$\{S3_BUCKET_NAME:-\}
STORAGE_S3_REGION=\$\{S3_REGION:-us-east-1\}
CACHE_REDISURL=\$\{REDIS_URL:-\}
EMAIL_FROM=\$\{EMAIL_FROM:-\}
EMAIL_FROMNAME=\$\{EMAIL_FROM_NAME:-OpenEvents\}
EMAIL_SMTP_HOST=\$\{SMTP_HOST:-\}
EMAIL_SMTP_PORT=\$\{SMTP_PORT:-587\}
EMAIL_SMTP_SECURE=\$\{SMTP_SECURE:-\}
EMAIL_SMTP_USER=\$\{SMTP_USER:-\}
EMAIL_SMTP_PASSWORD=\$\{SMTP_PASSWORD:-\}
PAYMENTS_STRIPE_PUBLISHABLEKEY=\$\{STRIPE_PUBLISHABLE_KEY:-\}
PAYMENTS_STRIPE_SECRETKEY=\$\{STRIPE_SECRET_KEY:-\}
PAYMENTS_STRIPE_WEBHOOKSECRET=\$\{STRIPE_WEBHOOK_SECRET:-\}
PAYMENTS_PAYPAL_CLIENTID=\$\{PAYPAL_CLIENT_ID:-\}
PAYMENTS_PAYPAL_CLIENTSECRET=\$\{PAYPAL_CLIENT_SECRET:-\}
PAYMENTS_PAYPAL_WEBHOOKID=\$\{PAYPAL_WEBHOOK_ID:-\}
ANALYTICS_ENABLED=\$\{ENABLE_ANALYTICS:-\}
ANALYTICS_GOOGLEANALYTICSID=\$\{GOOGLE_ANALYTICS_ID:-\}
RATELIMIT_MAX=\$\{RATE_LIMIT_MAX:-100\}
RATELIMIT_WINDOWMS=\$\{RATE_LIMIT_WINDOW_MS:-900000\}
EOF

# Execute the original command
exec "$@"
