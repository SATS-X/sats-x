import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
    return (
        <div className="app-ambient min-h-[100dvh] bg-bg text-text">
            <Header />
            <main id="main-content" className="mx-auto w-full max-w-[1200px] px-5 py-10 pb-20">
                <Outlet />
            </main>
        </div>
    )
}
