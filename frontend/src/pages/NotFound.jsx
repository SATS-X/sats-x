import { Link } from 'react-router-dom'
import { LuArrowLeft, LuCompass } from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui'

export default function NotFound() {
    const { isAuthenticated } = useAuth()
    return (
        <div className="app-ambient grid min-h-[100dvh] place-items-center bg-bg px-5 text-text">
            <div className="max-w-md text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                    <LuCompass className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="eyebrow mt-6">Error 404</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">This page does not exist</h1>
                <p className="mt-2 text-sm text-text-tertiary">The link may be old, or the page was moved. Use the button below to get back on track.</p>
                <Button as={Link} to={isAuthenticated ? '/dashboard' : '/'} className="mt-6">
                    <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
                </Button>
            </div>
        </div>
    )
}
