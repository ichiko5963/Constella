import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Needed for some S3 compatible providers like MinIO usually, R2 works without it but safe to check
});

export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
) {
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    try {
        // S3設定の確認
        if (!process.env.S3_BUCKET_NAME) {
            throw new Error('S3_BUCKET_NAME environment variable is not set');
        }
        if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
            throw new Error('S3 credentials are not set');
        }

        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return { url, key };
    } catch (error) {
        console.error('Error creating presigned URL:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to create upload URL: ${errorMessage}`);
    }
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error creating download URL:', error);
        throw new Error('Failed to create download URL');
    }
}
