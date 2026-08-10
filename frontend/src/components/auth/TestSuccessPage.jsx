import React from 'react'
import DashboardLayout from '../dashboard/DashboardLayout'

export default function TestSuccessPage({ user, onLockApp, onLogout }) {
  return <DashboardLayout user={user} onLockApp={onLockApp} onLogout={onLogout} />
}
