import React, { useState, useEffect, useRef } from 'react'
import { Bell, User, Sun, Moon, LogOut, CreditCard, Edit3, X, Check, Camera } from 'lucide-react'
import { profileService } from '../../services/profileService'

export default function Header({
  onNotificationClick,
  theme,
  onToggleTheme,
  user,
  userProfile,
  cardInfo,
  onLogout,
  onProfileUpdated,
}) {
  const [dateTimeStr, setDateTimeStr] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [avatarInput, setAvatarInput] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const menuRef = useRef(null)
  const isLight = theme === 'light'

  const avatarUrl =
    userProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null

  const userName =
    userProfile?.nickname ||
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Lorenxo'

  const userEmail = user?.email || 'Authenticated User'
  const cardNumber = userProfile?.card_number || cardInfo?.cardNumber || 'DK-0000-0000-0000'

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setDateTimeStr(`${datePart} | ${timePart}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenEditModal = () => {
    setNicknameInput(userName)
    setAvatarInput(avatarUrl || '')
    setShowProfileMenu(false)
    setIsEditProfileOpen(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user || !user.id) return

    setIsSavingProfile(true)
    try {
      const updated = await profileService.updateProfile(user.id, {
        nickname: nicknameInput.trim() || userName,
        avatar_url: avatarInput.trim() || avatarUrl,
      })

      setIsSavingProfile(false)
      setSaveSuccess(true)

      if (onProfileUpdated) {
        onProfileUpdated(updated)
      }

      setTimeout(() => {
        setSaveSuccess(false)
        setIsEditProfileOpen(false)
      }, 1000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setIsSavingProfile(false)
    }
  }

  return (
    <header className="w-full flex items-center justify-between py-3 border-b border-[#4a5156]/30 select-none relative z-40">
      <div className="flex items-center gap-2 text-xs font-Manrope font-medium text-[#808a92] dark:text-[#bdc7ce] tracking-wide">
        <span>{dateTimeStr}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e]/80 border border-[#4a5156]/30 dark:border-[#4a5156]/50 flex items-center justify-center text-[#4a5156] dark:text-[#bdc7ce] hover:text-[#000000] dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <button
          onClick={onNotificationClick}
          className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e]/80 border border-[#4a5156]/30 dark:border-[#4a5156]/50 flex items-center justify-center text-[#808a92] hover:text-[#000000] dark:hover:text-[#bdc7ce] transition-colors cursor-pointer relative shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#bdc7ce]" />
        </button>

        {/* Profile Avatar Button & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e] border border-[#4a5156]/30 dark:border-[#4a5156]/60 flex items-center justify-center text-[#4a5156] dark:text-[#bdc7ce] font-semibold shadow-md overflow-hidden cursor-pointer hover:border-white/50 transition-all active:scale-95"
            aria-label="User Account Menu"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-3 space-y-3 z-50 animate-fade-in ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
                  : 'bg-[#1a1e22]/95 border-[#4a5156]/60 text-white backdrop-blur-xl shadow-black/90'
              }`}
            >
              {/* User Header Info */}
              <div className="flex items-center gap-3 pb-2.5 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#bdc7ce]/20 border border-[#4a5156]/40 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[#bdc7ce]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate leading-snug">{userName}</span>
                  <span className="text-[10px] text-[#808a92] truncate">{userEmail}</span>
                </div>
              </div>

              {/* Card Number Info Badge */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#bdc7ce] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-[#808a92] font-semibold">
                    De'klo Card Number
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white truncate">
                    {cardNumber}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleOpenEditModal}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                      : 'bg-[#24292e] border-[#4a5156]/60 text-[#bdc7ce] hover:text-white hover:border-white/40'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    if (onLogout) onLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out & End Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customize Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsEditProfileOpen(false)}
          />

          <div
            className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl z-10 transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
                : 'bg-[#1a1e22] border-[#4a5156]/60 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-[#bdc7ce]" />
                <h3 className="text-base font-bold">Customize Profile</h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 text-[#808a92] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              {/* Profile Avatar Preview */}
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="relative w-20 h-20 rounded-full bg-[#bdc7ce]/20 border-2 border-[#bdc7ce]/50 flex items-center justify-center overflow-hidden shadow-xl">
                  {avatarInput ? (
                    <img src={avatarInput} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-[#bdc7ce]" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-[#808a92]">Profile Picture Preview</span>
              </div>

              {/* Nickname Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  Account Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lorenxo"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold outline-none border transition-all ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>

              {/* Avatar URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>

              {/* Card Number Display */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  De'klo Card Number
                </label>
                <div
                  className={`py-2.5 px-3.5 rounded-xl text-xs font-mono font-bold border ${
                    isLight
                      ? 'bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-[#000000]/40 border-[#4a5156]/40 text-[#bdc7ce]'
                  }`}
                >
                  {cardNumber}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#4a5156]/60 text-xs font-semibold text-[#bdc7ce] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || saveSuccess}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#bdc7ce] to-white text-black font-bold text-xs shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Saved!</span>
                    </>
                  ) : isSavingProfile ? (
                    <span>Saving to Supabase...</span>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
