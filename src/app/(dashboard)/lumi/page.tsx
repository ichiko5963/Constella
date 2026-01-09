import { Metadata } from 'next';
import { LumiChat } from '@/components/lumi';

export const metadata: Metadata = {
    title: 'Lumi | Constella',
    description: 'Lumiと対話してコンテキストを整理しよう',
};

export default function LumiPage() {
    return (
        <div className="h-[calc(100vh-6rem)] w-full -mx-8 -mt-6 -mb-8">
            <LumiChat />
        </div>
    );
}
