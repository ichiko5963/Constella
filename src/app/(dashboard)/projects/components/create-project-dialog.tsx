'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { createProject } from '@/server/actions/project';
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

const PROJECT_COLORS = [
    { name: 'Blue', value: '#007AFF' },
    { name: 'Purple', value: '#5856D6' },
    { name: 'Green', value: '#34C759' },
    { name: 'Orange', value: '#FF9500' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Teal', value: '#30B0C7' },
];

export function CreateProjectDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [color, setColor] = useState(PROJECT_COLORS[0].value);
    const formRef = useRef<HTMLFormElement>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('color', color);

        try {
            const res = await createProject(formData);
            setIsLoading(false);

            if (res.success) {
                // フォームをリセット（参照を使用）
                if (formRef.current) {
                    formRef.current.reset();
                }
                setColor(PROJECT_COLORS[0].value);
                setOpen(false);
                toast.success('プロジェクトを作成しました');
                // ページをリロードしてプロジェクト一覧を更新
                window.location.reload();
            } else {
                toast.error(res.error || 'プロジェクトの作成に失敗しました');
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Error creating project:', error);
            toast.error('プロジェクトの作成中にエラーが発生しました');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Create a new workspace for your recordings and tasks.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            name="name"
                            id="name"
                            placeholder="Acme Corp Meeting"
                            required
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            name="description"
                            id="description"
                            placeholder="Optional description"
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Color Code</Label>
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

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-primary text-black hover:bg-primary/90 w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
