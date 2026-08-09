import React from 'react'
import DashboardLayout from '../dashboard/DashboardLayout'

export default function TestSuccessPage({ user, onLockApp }) {
  return <DashboardLayout user={user} onLockApp={onLockApp} />
}
