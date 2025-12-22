'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProject } from '@/server/actions/delete-project';
import { useRouter } from 'next/navigation';

export function DeleteProjectButton({ projectId }: { projectId: number }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const result = await deleteProject(projectId);
            if (result.success) {
                router.push('/projects');
                router.refresh();
            } else {
                alert('Failed to delete project');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-10 w-10 rounded-full"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
