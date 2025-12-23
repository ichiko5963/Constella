'use server';

import { auth } from '@/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'share' | 'login' | 'logout';
export type ResourceType = 'recording' | 'note' | 'task' | 'project' | 'user' | 'integration';

/**
 * 監査ログを記録
 */
export async function logAuditEvent(
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: number,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        const session = await auth();
        const headersList = await headers();
        
        const ipAddress = headersList.get('x-forwarded-for') || 
                         headersList.get('x-real-ip') || 
                         'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        await db.insert(auditLogs).values({
            userId: session?.user?.id || null,
            action,
            resourceType,
            resourceId: resourceId || null,
            ipAddress,
            userAgent,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });
    } catch (error) {
        // 監査ログの失敗はアプリケーションの動作を妨げない
        console.error('Failed to log audit event:', error);
    }
}

/**
 * 監査ログを取得（管理者用）
 */
export async function getAuditLogs(
    userId?: string,
    resourceType?: ResourceType,
    limit: number = 100
) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // TODO: 管理者権限チェックを追加
        const logs = await db.query.auditLogs.findMany({
            where: (logs, { eq, and }) => {
                const conditions = [];
                if (userId) {
                    conditions.push(eq(logs.userId, userId));
                }
                if (resourceType) {
                    conditions.push(eq(logs.resourceType, resourceType));
                }
                return conditions.length > 0 ? and(...conditions) : undefined;
            },
            orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            limit,
        });

        return {
            success: true,
            logs: logs.map(log => ({
                id: log.id,
                userId: log.userId,
                action: log.action,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                metadata: log.metadata ? JSON.parse(log.metadata) : null,
                createdAt: log.createdAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return { success: false, error: 'Failed to retrieve audit logs' };
    }
}

