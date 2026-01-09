'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { approveTaskCandidate, rejectTaskCandidate } from '@/server/actions/task-approval';
import { useRouter } from 'next/navigation';

type Candidate = {
    id: number;
    title: string;
    description: string | null;
    suggestedDueDate: Date | null;
    suggestedPriority: string | null;
};

export function TaskApprovalList({ candidates }: { candidates: Candidate[] }) {
    const router = useRouter();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        await approveTaskCandidate(id);
        router.refresh();
        setProcessingId(null);
    };

    const handleReject = async (id: number) => {
        setProcessingId(id);
        await rejectTaskCandidate(id);
        router.refresh();
        setProcessingId(null);
    };

    if (candidates.length === 0) return null;

    return (
        <Card className="border-gray-200 mb-8 bg-gray-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base text-gray-900">
                    <Sparkles className="w-4 h-4 mr-2 text-gray-600" />
                    AI Suggested Tasks
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="flex-1 mr-4">
                            <h4 className="font-medium text-gray-900 text-sm">{candidate.title}</h4>
                            {candidate.description && (
                                <p className="text-xs text-gray-500 line-clamp-1">{candidate.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleReject(candidate.id)}
                                disabled={processingId === candidate.id}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-gray-900 text-white hover:bg-gray-800"
                                onClick={() => handleApprove(candidate.id)}
                                disabled={processingId === candidate.id}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
