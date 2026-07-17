'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'alert'
    isRead: boolean
    createdAt: string
}

export function NotificationMenu() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }, [])

    // Fetch on mount and set interval to check every 1 minute
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            })
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (unreadCount === 0) return
        
        setLoading(true)
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id))
                // If the deleted notification was unread, update the count
                const deletedNotif = notifications.find(n => n.id === id)
                if (deletedNotif && !deletedNotif.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'alert': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
        
        if (diffInSeconds < 60) return 'Baru saja'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
        return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-w-[calc(100vw-2rem)] p-0 max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 hover:bg-transparent"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                        >
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>
                
                <div className="overflow-y-auto flex-1 p-1">
                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Belum ada notifikasi
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                className={cn(
                                    "flex gap-3 px-3 py-3 rounded-md mb-1 cursor-default group",
                                    notif.isRead ? "opacity-75" : "bg-blue-50 dark:bg-blue-950/20"
                                )}
                            >
                                <div className="mt-0.5 flex-shrink-0">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 space-y-1 overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <p className={cn(
                                            "text-sm font-medium leading-none", 
                                            notif.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"
                                        )}>
                                            {notif.title}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {formatTimeAgo(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notif.message}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notif.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                                            title="Tandai dibaca"
                                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                        title="Hapus"
                                        onClick={(e) => handleDelete(notif.id, e)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
