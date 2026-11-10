import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
    return (
        <div className="app-ambient min-h-[100dvh] bg-bg text-text lg:flex">
            <Sidebar />
            <main id="main-content" className="min-w-0 flex-1">
                <div className="mx-auto w-full max-w-[1200px] px-5 py-8 pb-20 lg:px-8 lg:py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
