'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Loader2, Archive, Trash2 } from 'lucide-react';
import { updateProject, archiveProject } from '@/server/actions/project';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const PROJECT_COLORS = [
    { name: 'Blue', value: '#007AFF' },
    { name: 'Purple', value: '#5856D6' },
    { name: 'Green', value: '#34C759' },
    { name: 'Orange', value: '#FF9500' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Teal', value: '#30B0C7' },
];

interface Project {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    isArchived: boolean | null;
}

export function ProjectSettingsDialog({ project }: { project: Project }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [color, setColor] = useState(project.color || PROJECT_COLORS[0].value);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set('color', color);
        // Explicitly set isArchived if not present, though update usually handles existing
        // but here we are updating standard fields.

        const res = await updateProject(project.id, formData);
        setIsLoading(false);

        if (res.success) {
            setOpen(false);
            toast.success('Project updated');
        } else {
            toast.error(res.error || 'Failed to update project');
        }
    }

    async function handleArchive() {
        if (!confirm('Are you sure you want to archive this project?')) return;

        setIsLoading(true);
        const res = await archiveProject(project.id);
        setIsLoading(false);

        if (res.success) {
            toast.success('Project archived');
            setOpen(false);
            router.push('/projects');
        } else {
            toast.error(res.error || 'Failed to archive project');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5 text-gray-400" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                    <DialogDescription>
                        Manage project details and preferences.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            name="name"
                            id="name"
                            defaultValue={project.name}
                            required
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            name="description"
                            id="description"
                            defaultValue={project.description || ''}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Color Theme</Label>
                        <Select value={color} onValueChange={setColor}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                                {PROJECT_COLORS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                                            {c.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
                        <Button type="button" variant="destructive" onClick={handleArchive} disabled={isLoading} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Archive className="mr-2 h-4 w-4" />
                            Archive Project
                        </Button>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isLoading} className="bg-primary text-black hover:bg-primary/90 w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
