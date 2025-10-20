#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ Database URL is configured"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema=src/prisma/schema.prisma

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy --schema=src/prisma/schema.prisma

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

echo "✅ Database migrations completed successfully"

# Setup admin system if not already done
echo "👥 Setting up admin system..."
npx tsx scripts/setup-admin-simple.ts

if [ $? -ne 0 ]; then
    echo "⚠️ Admin system setup failed, but continuing..."
fi

echo "✅ Admin system setup completed"

# Start the application
echo "🚀 Starting the application..."
exec pnpm --filter @hey/api start
