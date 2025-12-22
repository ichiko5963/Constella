import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-48 bg-white/10 mb-2" />
                    <Skeleton className="h-4 w-64 bg-white/10" />
                </div>
                <Skeleton className="h-10 w-32 bg-white/10" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
                ))}
            </div>
        </div>
    );
}
