'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    BarChart3,
} from 'lucide-react'

const bottomNavItems = [
    {
        title: 'Home',
        icon: LayoutDashboard,
        href: '/dashboard',
        color: 'text-blue-600',
    },
    {
        title: 'Transaksi',
        icon: ArrowLeftRight,
        href: '/transactions',
        color: 'text-green-600',
    },
    {
        title: 'Dompet',
        icon: Wallet,
        href: '/wallets',
        color: 'text-amber-600',
    },
    {
        title: 'Laporan',
        icon: BarChart3,
        href: '/reports',
        color: 'text-indigo-600',
    },
]

export function BottomNav() {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {bottomNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                            active ? item.color : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        )}
                    >
                        <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
                        <span className={cn('text-[10px] font-medium', active && 'font-bold')}>
                            {item.title}
                        </span>
                    </Link>
                )
            })}
        </div>
    )
}
