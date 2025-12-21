'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { createRecordingUploadUrl } from '@/server/actions/recording';
import { processRecording } from '@/server/actions/process-audio';
import { useRouter } from 'next/navigation';

export function UploadRecordingButton({ projectId }: { projectId: number }) {
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            // 1. Get Presigned URL
            const { success, url, recordingId, error } = await createRecordingUploadUrl(projectId, file.type);

            if (!success || !url || !recordingId) {
                throw new Error(error || 'Failed to get upload URL');
            }

            // 2. Upload to S3
            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error('Upload failed');
            }

            // 3. Trigger Processing (Background ideally, but calling server action for now)
            // First update status to uploaded? The action createRecordingUploadUrl set it to 'uploading'.
            // Only process if upload successful.

            // Start processing async (don't await for UI responsiveness if it takes long, 
            // but here we wait to show initial 'processing' state refresh)
            await processRecording(recordingId); // This might timeout if long, but let's trigger it.

            alert('Upload successful! Processing started.');
            router.refresh();

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                alert(`Error: ${err.message}`);
            } else {
                alert('An unknown error occurred');
            }
        } finally {
            setIsUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                id="upload-recording"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
            />
            <label htmlFor="upload-recording">
                <Button
                    disabled={isUploading}
                    className="cursor-pointer"
                    asChild
                >
                    <span>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Recording'}
                    </span>
                </Button>
            </label>
        </div>
    );
}
