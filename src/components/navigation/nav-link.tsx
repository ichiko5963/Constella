'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function NavLink({ href, children, className = '', onClick }: NavLinkProps) {
    const pathname = usePathname();
    const router = useRouter();
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onClick) {
            onClick();
        }
        router.push(href);
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            prefetch={true}
            className={`${className} ${isActive ? 'bg-gray-200 text-gray-900' : ''}`}
        >
            {children}
        </Link>
    );
}
