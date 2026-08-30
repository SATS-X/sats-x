import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-[100dvh] w-screen overflow-hidden bg-bg">
            <div className="hidden h-full shrink-0 lg:block">
                <Sidebar />
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative z-10 h-full">
                        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
                <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl pb-12">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
