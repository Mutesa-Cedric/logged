import { PrismaClient } from '@prisma/client';

declare global {
    var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

// Database connection function
export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// Graceful shutdown
export async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected successfully');
    } catch (error) {
        console.error('❌ Database disconnection failed:', error);
    }
}

// Health check
export async function checkDatabaseHealth() {
    try {
        // @ts-ignore
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
        };
    }
} 