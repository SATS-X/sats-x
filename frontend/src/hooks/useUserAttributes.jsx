import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to retrieve current user attributes from AuthContext
 */
const useUserAttributes = () => {
    const { user } = useAuth()
    if (!user) return null

    return {
        sub: user.userId || user.id || user.email,
        email: user.email,
        name: user.fullName || user.email,
        preferred_username: user.email?.split('@')[0],
        role: user.role
    }
}

export default useUserAttributes
