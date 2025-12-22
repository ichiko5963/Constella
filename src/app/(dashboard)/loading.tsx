import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-48 bg-white/10" />
                <Skeleton className="h-10 w-32 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-xl bg-white/5" />
                ))}
            </div>
        </div>
    );
}
