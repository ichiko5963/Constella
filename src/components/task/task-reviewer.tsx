'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, X, Check, Loader2, ArrowRight } from 'lucide-react';
import { approveTaskCandidate, rejectTaskCandidate } from '@/server/actions/task-approval';
import { useRouter } from 'next/navigation';

interface TaskCandidate {
    id: number;
    title: string;
    description: string | null;
    suggestedPriority: string | null;
    isApproved: boolean | null;
}

export function TaskReviewer({ candidates, recordingId }: { candidates: TaskCandidate[], recordingId: number }) {
    const [pendingCandidates, setPendingCandidates] = useState(candidates.filter(c => c.isApproved === null));
    const [processingId, setProcessingId] = useState<number | null>(null);
    const router = useRouter();

    const handleApprove = async (candidate: TaskCandidate) => {
        setProcessingId(candidate.id);
        try {
            const res = await approveTaskCandidate(candidate.id);
            if (res.success) {
                setPendingCandidates(prev => prev.filter(c => c.id !== candidate.id));
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to approve task', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (candidate: TaskCandidate) => {
        setProcessingId(candidate.id);
        try {
            const res = await rejectTaskCandidate(candidate.id);
            if (res.success) {
                setPendingCandidates(prev => prev.filter(c => c.id !== candidate.id));
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to reject task', error);
        } finally {
            setProcessingId(null);
        }
    };

    if (pendingCandidates.length === 0) {
        return (
            <Card className="glass border-white/10 w-full bg-black/20">
                <CardHeader className="pb-2 border-b border-white/5">
                    <CardTitle className="text-xl flex items-center gap-2 text-white">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        Task Candidates
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                            <Check className="w-6 h-6 text-green-500" />
                        </div>
                        <p>All candidates reviewed!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10 w-full bg-black/20 h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Review Tasks ({pendingCandidates.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {pendingCandidates.map((candidate) => (
                    <div key={candidate.id} className="bg-white/5 border border-white/10 rounded-lg p-4 group hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h4 className="font-medium text-white mb-1 group-hover:text-primary transition-colors">{candidate.title}</h4>
                                {candidate.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2">{candidate.description}</p>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${candidate.suggestedPriority === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                        candidate.suggestedPriority === 'medium' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                            'text-blue-400 border-blue-500/20 bg-blue-500/10'
                                        }`}>
                                        {candidate.suggestedPriority || 'medium'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleReject(candidate)}
                                    disabled={processingId === candidate.id}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary"
                                    onClick={() => handleApprove(candidate)}
                                    disabled={processingId === candidate.id}
                                >
                                    {processingId === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
