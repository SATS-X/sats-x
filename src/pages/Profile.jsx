import { useState, useEffect } from 'react'
import { HiOutlineKey } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Avatar, Badge, Button, Field, Input, Modal } from '../components/ui'

const EMPTY_FORM = { full_name: '', phone_number: '', department: '', position: '' }

export default function Profile() {
    const { t } = useLanguage()
    const { user, updateProfile, changePassword } = useAuth()
    const { showSuccess, showError } = useToast()

    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

    useEffect(() => {
        if (user) {
            setForm({
                full_name: user.full_name || '',
                phone_number: user.phone_number || '',
                department: user.department || '',
                position: user.position || ''
            })
        }
    }, [user])

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await updateProfile(form)
            if (res.success) {
                showSuccess('Profile updated', 'Success')
                setIsEditing(false)
            } else {
                showError(res.message || 'Update failed', 'Error')
            }
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            showError('New passwords do not match', 'Error')
            return
        }

        setChangingPassword(true)
        try {
            const res = await changePassword(oldPassword, newPassword)
            if (res?.success) {
                showSuccess('Password changed', 'Success')
                setPasswordModalOpen(false)
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                showError(res?.message || 'Password change failed', 'Error')
            }
        } finally {
            setChangingPassword(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="inline-flex items-center gap-2.5 text-xl font-semibold text-text">
                    {t('userProfile')}
                    <Badge className="capitalize">{user?.role || 'teacher'}</Badge>
                </h1>
                <p className="mt-1 text-sm text-text-secondary">{t('userProfileDesc')}</p>
            </div>

            <div className="flex flex-col items-center gap-6 rounded-card border border-border bg-surface p-6 sm:flex-row">
                <Avatar name={user?.full_name || user?.email} size="lg" className="text-2xl" />

                <div className="flex-1 space-y-1 text-center sm:text-left">
                    <h2 className="text-lg font-semibold text-text">{user?.full_name || 'SATS X instructor'}</h2>
                    <p className="font-data text-xs text-text-tertiary">{user?.email}</p>
                    {user?.department && (
                        <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
                            <Badge>{user.department}</Badge>
                        </div>
                    )}
                </div>

                <Button variant="secondary" size="sm" onClick={() => setPasswordModalOpen(true)}>
                    <HiOutlineKey className="h-4 w-4" />
                    Change password
                </Button>
            </div>

            <div className="rounded-card border border-border bg-surface p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-text">{t('personalInfo')}</h3>
                    <Button variant={isEditing ? 'ghost' : 'secondary'} size="sm" onClick={() => setIsEditing((v) => !v)}>
                        {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Full name">
                            <Input
                                disabled={!isEditing}
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            />
                        </Field>
                        <Field label="Email" hint="Cannot be changed">
                            <Input disabled value={user?.email || ''} className="font-data" />
                        </Field>
                        <Field label="Phone number">
                            <Input
                                disabled={!isEditing}
                                value={form.phone_number}
                                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                placeholder="0987654321"
                                className="font-data"
                            />
                        </Field>
                        <Field label="Position">
                            <Input
                                disabled={!isEditing}
                                value={form.position}
                                onChange={(e) => setForm({ ...form, position: e.target.value })}
                                placeholder="Instructor"
                            />
                        </Field>
                        <Field label="Department / Unit" className="sm:col-span-2">
                            <Input
                                disabled={!isEditing}
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                placeholder="School of Computing"
                            />
                        </Field>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={saving}>
                                Save changes
                            </Button>
                        </div>
                    )}
                </form>
            </div>

            <Modal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                title="Change account password"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="change-password-form" loading={changingPassword}>
                            Change password
                        </Button>
                    </>
                }
            >
                <form id="change-password-form" onSubmit={handleChangePassword} className="space-y-4">
                    <Field label="Current password" required>
                        <Input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </Field>
                    <Field label="New password" required hint="At least 8 characters, including letters and numbers">
                        <Input
                            type="password"
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </Field>
                    <Field label="Confirm new password" required>
                        <Input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </Field>
                </form>
            </Modal>
        </div>
    )
}
