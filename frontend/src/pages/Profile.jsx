import { useState, useEffect } from 'react'
import { LuBriefcase, LuBuilding2, LuKeyRound, LuMail, LuPhone, LuUser } from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Avatar, Button, Card, CardHeader, Field, Input, Modal, PageHeader } from '../components/ui'

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
        <div className="mx-auto max-w-[880px] space-y-6">
            <PageHeader eyebrow="Account" title={t('userProfile')} description={t('userProfileDesc')} />

            <div className="grid items-start gap-4 md:grid-cols-[1fr_260px]">
                <Card padded={false}>
                    <CardHeader
                        title={t('personalInfo')}
                        action={
                            <Button variant={isEditing ? 'ghost' : 'secondary'} size="sm" onClick={() => setIsEditing((v) => !v)}>
                                {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                        }
                    />

                    <form onSubmit={handleSaveProfile} className="space-y-4 p-5">
                        <Field label="Full name">
                            <Input icon={LuUser} disabled={!isEditing} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                        </Field>
                        <Field label="Email" hint="Cannot be changed">
                            <Input icon={LuMail} disabled value={user?.email || ''} className="font-data" />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Phone number">
                                <Input
                                    icon={LuPhone}
                                    disabled={!isEditing}
                                    value={form.phone_number}
                                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                    placeholder="0987654321"
                                    className="font-data"
                                />
                            </Field>
                            <Field label="Position">
                                <Input
                                    icon={LuBriefcase}
                                    disabled={!isEditing}
                                    value={form.position}
                                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    placeholder="Instructor"
                                />
                            </Field>
                        </div>
                        <Field label="Department / Unit">
                            <Input
                                icon={LuBuilding2}
                                disabled={!isEditing}
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                placeholder="School of Computing"
                            />
                        </Field>

                        {isEditing && (
                            <div className="pt-1">
                                <Button type="submit" size="lg" loading={saving}>
                                    Save changes
                                </Button>
                            </div>
                        )}
                    </form>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <Avatar name={user?.full_name || user?.email} size="md" className="!border-0 !bg-accent/10 !text-accent" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text">{user?.full_name || 'SATS X instructor'}</p>
                            <p className="truncate text-xs text-text-tertiary">{user?.email}</p>
                        </div>
                    </div>

                    <dl className="mt-5 space-y-3 text-xs">
                        <div>
                            <dt className="text-text-tertiary">Role</dt>
                            <dd className="mt-0.5 capitalize text-text-secondary">{user?.role || 'teacher'}</dd>
                        </div>
                        <div>
                            <dt className="text-text-tertiary">Position</dt>
                            <dd className="mt-0.5 text-text-secondary">{form.position || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-text-tertiary">Department</dt>
                            <dd className="mt-0.5 text-text-secondary">{form.department || '—'}</dd>
                        </div>
                    </dl>

                    <Button variant="secondary" size="sm" className="mt-5 w-full" onClick={() => setPasswordModalOpen(true)}>
                        <LuKeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                        Change password
                    </Button>
                </Card>
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
                        <Input type="password" required autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" />
                    </Field>
                    <Field label="New password" required hint="At least 8 characters, including letters and numbers">
                        <Input
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </Field>
                    <Field label="Confirm new password" required>
                        <Input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    </Field>
                </form>
            </Modal>
        </div>
    )
}
