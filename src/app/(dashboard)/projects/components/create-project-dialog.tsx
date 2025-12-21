'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { createProject } from '@/server/actions/project';
import { useRouter } from 'next/navigation';

// Simplified "Dialog" for MVP speed - just a conditional render or standard Dialog if I installed radix primitive.
// Since I haven't installed Dialog primitive yet, I'll make a simple inline form toggle or custom modal.
// Let's go with a custom modal to keep it clean.

export function CreateProjectDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function onSubmit(formData: FormData) {
        setIsLoading(true);
        const res = await createProject(formData);
        setIsLoading(false);

        if (res.success) {
            setIsOpen(false);
            // router.refresh() is handled by revalidatePath in server action usually, but sometimes client refresh needed for immediate feedback if utilizing client cache aggressively.
        } else {
            alert(res.error);
        }
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Create Project</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={onSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                                <Input name="name" id="name" placeholder="Acme Corp Meeting" required className="mt-1" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <Input name="description" id="description" placeholder="Optional description" className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
