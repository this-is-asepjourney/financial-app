'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ArrowLeftRight,
    FolderOpen,
    Wallet,
    Target,
    TrendingUp,
    BarChart3,
    Heart,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    Sun,
    Moon,
    CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BottomNav } from '@/components/layout/BottomNav'
import { NotificationMenu } from '@/components/layout/NotificationMenu'

const menuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        title: 'Transaksi',
        icon: ArrowLeftRight,
        href: '/transactions',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        title: 'Kategori',
        icon: FolderOpen,
        href: '/categories',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
    },
    {
        title: 'Dompet',
        icon: Wallet,
        href: '/wallets',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
    },
    {
        title: 'Budget',
        icon: Wallet,
        href: '/budget',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    {
        title: 'Goals',
        icon: Target,
        href: '/goals',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    {
        title: 'Utang & Cicilan',
        icon: CreditCard,
        href: '/debts',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
    },
    {
        title: 'Investasi',
        icon: TrendingUp,
        href: '/investments',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
    },
    {
        title: 'Laporan',
        icon: BarChart3,
        href: '/reports',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
    },
    {
        title: 'Financial Health',
        icon: Heart,
        href: '/financial-health',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()
    const user = session?.user
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0)
        return () => clearTimeout(timer)
    }, [])

    const handleLogout = () => {
        signOut({ callbackUrl: '/' })
        router.push('/auth/login')
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            FinansialApp
                        </span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.email || 'user@email.com'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                                    active
                                        ? `${item.bgColor} dark:bg-gray-700/50 ${item.color} dark:text-white font-semibold shadow-sm border border-${item.color.split('-')[1]}-200/50 dark:border-gray-600`
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 transition-colors',
                                        active ? item.color : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                    )}
                                />
                                <span>{item.title}</span>
                                {active && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                    <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
                    >
                        <Settings className="h-5 w-5 text-gray-400" />
                        <span>Pengaturan</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Navbar */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                        {/* Left side */}
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            {/* Breadcrumb */}
                            <div className="hidden sm:flex items-center space-x-2 text-sm">
                                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    Home
                                </Link>
                                {pathname !== '/dashboard' && (
                                    <>
                                        <ChevronDown className="h-4 w-4 text-gray-400 rotate-270" />
                                        <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                                            {pathname.split('/')[1]?.replace('-', ' ') || ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-2">
                            {/* Notifications */}
                            <NotificationMenu />

                            {/* Theme Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                                {mounted ? (
                                    theme === 'dark' ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )
                                ) : (
                                    <div className="h-5 w-5" />
                                )}
                            </Button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium">{user?.name || 'User'}</p>
                                            <p className="text-xs text-gray-500">{user?.email || ''}</p>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Pengaturan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/financial-health')}>
                                        <Heart className="mr-2 h-4 w-4" />
                                        Financial Health
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Keluar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 pb-24 lg:p-6 lg:pb-6">
                    {children}
                </main>
            </div>
            
            <BottomNav />
        </div>
    )
}