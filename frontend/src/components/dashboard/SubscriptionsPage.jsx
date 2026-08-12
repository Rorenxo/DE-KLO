import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  CreditCard,
  Search,
  X,
  Trash2,
  Edit2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Check,
  AlertTriangle,
} from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'

import adobeSvg from '../../assets/icons8-adobe.svg'
import amazonSvg from '../../assets/icons8-amazon.svg'
import canvaSvg from '../../assets/icons8-canva-app.svg'
import chatgptSvg from '../../assets/icons8-chatgpt.svg'
import claudeSvg from '../../assets/icons8-claude.svg'
import cursorSvg from '../../assets/icons8-cursor-ai.svg'
import disneySvg from '../../assets/icons8-disney.svg'
import dropboxSvg from '../../assets/icons8-dropbox.svg'
import geminiSvg from '../../assets/icons8-gemini-ai.svg'
import githubSvg from '../../assets/icons8-github.svg'
import googleOneSvg from '../../assets/icons8-google-one.svg'
import gymSvg from '../../assets/icons8-gym.svg'
import icloudSvg from '../../assets/icons8-icloud.svg'
import m365Svg from '../../assets/icons8-microsoft-365.svg'
import netflixSvg from '../../assets/icons8-netflix.svg'
import notionSvg from '../../assets/icons8-notion.svg'
import spotifySvg from '../../assets/icons8-spotify.svg'
import wifiSvg from '../../assets/icons8-wifi.svg'
import youtubeSvg from '../../assets/icons8-youtube.svg'

const SERVICE_SVGS = {
  'Netflix': <img src={netflixSvg} alt="Netflix" className="w-full h-full object-contain" />,
  'Spotify': <img src={spotifySvg} alt="Spotify" className="w-full h-full object-contain" />,
  'YouTube Premium': <img src={youtubeSvg} alt="YouTube Premium" className="w-full h-full object-contain" />,
  'Google One': <img src={googleOneSvg} alt="Google One" className="w-full h-full object-contain" />,
  'ChatGPT': <img src={chatgptSvg} alt="ChatGPT" className="w-full h-full object-contain" />,
  'Claude': <img src={claudeSvg} alt="Claude" className="w-full h-full object-contain" />,
  'Gemini': <img src={geminiSvg} alt="Gemini" className="w-full h-full object-contain" />,
  'Canva': <img src={canvaSvg} alt="Canva" className="w-full h-full object-contain" />,
  'Adobe': <img src={adobeSvg} alt="Adobe" className="w-full h-full object-contain" />,
  'Microsoft 365': <img src={m365Svg} alt="Microsoft 365" className="w-full h-full object-contain" />,
  'Amazon Prime': <img src={amazonSvg} alt="Amazon Prime" className="w-full h-full object-contain" />,
  'Disney+': <img src={disneySvg} alt="Disney+" className="w-full h-full object-contain" />,
  'Dropbox': <img src={dropboxSvg} alt="Dropbox" className="w-full h-full object-contain" />,
  'iCloud+': <img src={icloudSvg} alt="iCloud+" className="w-full h-full object-contain" />,
  'Notion': <img src={notionSvg} alt="Notion" className="w-full h-full object-contain" />,
  'GitHub': <img src={githubSvg} alt="GitHub" className="w-full h-full object-contain" />,
  'Cursor': <img src={cursorSvg} alt="Cursor" className="w-full h-full object-contain" />,
  'Gym membership': <img src={gymSvg} alt="Gym membership" className="w-full h-full object-contain" />,
  'Internet': <img src={wifiSvg} alt="Internet" className="w-full h-full object-contain" />,
  'Phone plan': null,
}

const PREDEFINED_SERVICES = Object.keys(SERVICE_SVGS)

const BILLING_CYCLE_MONTHS = {
  '1 Month': 1,
  '3 Months': 3,
  '6 Months': 6,
  '1 Year': 12,
}

function calculateDates(startDateStr, cycleStr) {
  const todayIso = new Date().toISOString().split('T')[0]
  const validStartStr = (!startDateStr || startDateStr < todayIso) ? todayIso : startDateStr
  const start = new Date(validStartStr)

  if (isNaN(start.getTime())) {
    const fallback = new Date()
    return {
      currentPeriodStart: fallback.toISOString().split('T')[0],
      currentPeriodEnd: fallback.toISOString().split('T')[0],
      nextBillingDate: fallback.toISOString().split('T')[0],
    }
  }

  const monthsToAdd = BILLING_CYCLE_MONTHS[cycleStr] || 1
  const end = new Date(start)
  end.setMonth(end.getMonth() + monthsToAdd)

  const formatIso = (d) => d.toISOString().split('T')[0]

  return {
    currentPeriodStart: formatIso(start),
    currentPeriodEnd: formatIso(end),
    nextBillingDate: formatIso(end),
  }
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SubscriptionsPage({ theme = 'dark', onSubscriptionAdded }) {
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('deklo_subscriptions_data')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [selectedSub, setSelectedSub] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [pendingAddData, setPendingAddData] = useState(null)
  const [pendingDeleteSub, setPendingDeleteSub] = useState(null)

  const isLight = theme === 'light'

  const saveSubsState = (newArr) => {
    setSubscriptions(newArr)
    try {
      localStorage.setItem('deklo_subscriptions_data', JSON.stringify(newArr))
    } catch { }
  }

  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active')
  }, [subscriptions])

  const upcomingTotal = useMemo(() => {
    return activeSubs.reduce((acc, s) => acc + (Number(s.amount) || 0), 0)
  }, [activeSubs])

  const upcomingSoonList = useMemo(() => {
    return [...activeSubs]
      .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))
      .slice(0, 3)
  }, [activeSubs])

  const handleCreateOrUpdateSub = async (subData) => {
    if (editingSub) {
      const updated = subscriptions.map((s) => (s.id === editingSub.id ? { ...s, ...subData } : s))
      saveSubsState(updated)
      if (selectedSub && selectedSub.id === editingSub.id) {
        setSelectedSub({ ...selectedSub, ...subData })
      }
    } else {
      const newSub = {
        id: `sub_${Date.now()}`,
        ...subData,
        status: 'active',
      }
      saveSubsState([newSub, ...subscriptions])

      if (onSubscriptionAdded) {
        await onSubscriptionAdded(newSub)
      }
    }
    setIsAddModalOpen(false)
    setEditingSub(null)
    setPendingAddData(null)
  }

  const handleDeleteSub = (id) => {
    const updated = subscriptions.filter((s) => s.id !== id)
    saveSubsState(updated)
    setSelectedSub(null)
    setPendingDeleteSub(null)
  }

  const handleTogglePauseSub = (id) => {
    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        const nextStatus = s.status === 'active' ? 'paused' : 'active'
        return { ...s, status: nextStatus }
      }
      return s
    })
    saveSubsState(updated)
    if (selectedSub && selectedSub.id === id) {
      setSelectedSub({
        ...selectedSub,
        status: selectedSub.status === 'active' ? 'paused' : 'active',
      })
    }
  }

  const cardBg = isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
  const elevatedBg = isLight ? 'bg-[#F4F5FA] border-[#E8EAF0]' : 'bg-[#181b20] border-[#242830]'
  const textPrimary = isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
  const textSecondary = isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
  const textMuted = isLight ? 'text-[#8D95A1]' : 'text-[#64748B]'

  return (
    <div className="w-full space-y-6 pb-20 sm:pb-12 animate-fade-in select-none">
      <ScrollFadeIn>
        <header className="flex items-center justify-between pt-1 pb-1">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'}`}>
              Subscriptions
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-[#68707C] font-medium' : 'text-[#B8C0C8]'}`}>
              Keep track of your subscriptions and upcoming payments.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingSub(null)
              setIsAddModalOpen(true)
            }}
            className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md active:scale-[0.985] transition-all cursor-pointer ${isLight ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]' : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
              }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription</span>
          </button>
        </header>
      </ScrollFadeIn>

      {subscriptions.length > 0 && (
        <ScrollFadeIn>
          <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${textMuted}`}>
                  Upcoming this month
                </span>
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-0.5 ${textPrimary}`}>
                  ₱{upcomingTotal.toLocaleString()}
                </div>
              </div>
              <span className={`text-xs font-medium ${textMuted}`}>
                Expected subscription deductions
              </span>
            </div>

            {upcomingSoonList.length > 0 && (
              <div className="pt-2 border-t border-slate-700/20 space-y-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider block ${textMuted}`}>
                  Upcoming Renewals
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {upcomingSoonList.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-slate-500/40 active:scale-[0.98] ${elevatedBg}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/20 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-sm p-1">
                          {SERVICE_SVGS[sub.name] ? (
                            SERVICE_SVGS[sub.name]
                          ) : (
                            <span className="text-black uppercase font-bold">{sub.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className={`block text-xs font-bold truncate ${textPrimary}`}>
                            {sub.name}
                          </span>
                          <span className={`block text-[10px] ${textMuted}`}>
                            Renews {formatDateShort(sub.nextBillingDate)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold font-mono ${textPrimary}`}>
                        ₱{sub.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollFadeIn>
      )}

      <ScrollFadeIn>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
              All Subscriptions
            </h2>
            <span className={`text-xs font-medium ${textMuted}`}>
              {subscriptions.length} {subscriptions.length === 1 ? 'Service' : 'Services'}
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className={`p-8 sm:p-12 text-center rounded-2xl border ${cardBg} space-y-4 shadow-sm`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-700/20 border border-slate-700/40 flex items-center justify-center mx-auto">
                <CreditCard className={`w-6 h-6 ${textMuted}`} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${textPrimary}`}>No subscriptions yet</h3>
                <p className={`text-xs max-w-xs mx-auto ${textSecondary}`}>
                  Keep track of the services that regularly take money from your wallet.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingSub(null)
                  setIsAddModalOpen(true)
                }}
                className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md active:scale-[0.985] transition-all cursor-pointer ${isLight ? 'bg-[#212529] text-white hover:bg-black' : 'bg-white text-black hover:bg-slate-100'
                  }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Subscription</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-150 hover:border-slate-500/50 active:scale-[0.985] shadow-sm ${cardBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/20 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-sm p-1.5">
                      {SERVICE_SVGS[sub.name] ? (
                        SERVICE_SVGS[sub.name]
                      ) : (
                        <span className="text-black uppercase font-bold">{sub.name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className={`block text-sm font-bold truncate ${textPrimary}`}>
                        {sub.name}
                      </span>
                      <span className={`block text-xs font-medium mt-0.5 ${textSecondary}`}>
                        {sub.status === 'paused'
                          ? 'Paused'
                          : `Renews ${formatDateShort(sub.nextBillingDate)}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`block text-base font-bold font-mono ${textPrimary}`}>
                      ₱{Number(sub.amount).toLocaleString()}
                    </span>
                    <span className={`text-[10px] block ${textMuted}`}>
                      {sub.billingCycle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollFadeIn>

      {selectedSub && (
        <SubscriptionDetailModal
          sub={selectedSub}
          theme={theme}
          onClose={() => setSelectedSub(null)}
          onEdit={() => {
            setEditingSub(selectedSub)
            setSelectedSub(null)
            setIsAddModalOpen(true)
          }}
          onTogglePause={() => handleTogglePauseSub(selectedSub.id)}
          onDelete={() => {
            setPendingDeleteSub(selectedSub)
            setSelectedSub(null)
          }}
        />
      )}

      {isAddModalOpen && (
        <AddEditSubscriptionModal
          theme={theme}
          initialSub={editingSub}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingSub(null)
          }}
          onSubmit={(subData) => {
            if (editingSub) {
              handleCreateOrUpdateSub(subData)
            } else {
              setPendingAddData(subData)
              setIsAddModalOpen(false)
            }
          }}
        />
      )}

      {pendingAddData && (
        <ConfirmAddModal
          subData={pendingAddData}
          theme={theme}
          onClose={() => {
            setPendingAddData(null)
            setIsAddModalOpen(true)
          }}
          onConfirm={() => handleCreateOrUpdateSub(pendingAddData)}
        />
      )}

      {pendingDeleteSub && (
        <ConfirmDeleteModal
          sub={pendingDeleteSub}
          theme={theme}
          onClose={() => {
            setSelectedSub(pendingDeleteSub)
            setPendingDeleteSub(null)
          }}
          onConfirm={() => handleDeleteSub(pendingDeleteSub.id)}
        />
      )}
    </div>
  )
}

function ConfirmAddModal({ subData, theme, onClose, onConfirm }) {
  const isLight = theme === 'light'
  const modalBg = isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#121418] text-[#F1F3F5] border-slate-700/40'
  const elevatedBg = isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181b20] border-[#242830]'
  const textPrimary = isLight ? 'text-slate-900 font-bold' : 'text-[#F1F3F5] font-bold'
  const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`relative w-full max-w-sm rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 space-y-4 ${modalBg} text-center`}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
          <Check className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className={`text-base font-extrabold tracking-tight ${textPrimary}`}>Confirm Subscription</h3>
          <p className={`text-xs ${textSecondary}`}>
            Are you sure you want to add this subscription to your account?
          </p>
        </div>

        <div className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 ${elevatedBg}`}>
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/20 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-sm p-1">
            {SERVICE_SVGS[subData.name] ? (
              SERVICE_SVGS[subData.name]
            ) : (
              <span className="text-black uppercase font-bold">{subData.name.slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`block text-xs font-extrabold truncate ${textPrimary}`}>{subData.name}</span>
            <span className={`block text-[11px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              ₱{Number(subData.amount).toLocaleString()} / {subData.billingCycle}
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-[11px] text-left leading-relaxed ${isLight ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
          Notice: This action will automatically log a deduction transaction of ₱{Number(subData.amount).toLocaleString()} to your balance.
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${isLight ? 'border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200' : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md active:scale-[0.985] transition-all cursor-pointer ${isLight ? 'bg-slate-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-slate-100'
              }`}
          >
            Yes, Add Subscription
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ConfirmDeleteModal({ sub, theme, onClose, onConfirm }) {
  const isLight = theme === 'light'
  const modalBg = isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#121418] text-[#F1F3F5] border-slate-700/40'
  const elevatedBg = isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181b20] border-[#242830]'
  const textPrimary = isLight ? 'text-slate-900 font-bold' : 'text-[#F1F3F5] font-bold'
  const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`relative w-full max-w-sm rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 space-y-4 ${modalBg} text-center`}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className={`text-base font-extrabold tracking-tight ${textPrimary}`}>Delete Subscription?</h3>
          <p className={`text-xs ${textSecondary}`}>
            Are you sure you want to delete this subscription?
          </p>
        </div>

        <div className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 ${elevatedBg}`}>
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/20 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-sm p-1">
            {SERVICE_SVGS[sub.name] ? (
              SERVICE_SVGS[sub.name]
            ) : (
              <span className="text-black uppercase font-bold">{sub.name.slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`block text-xs font-extrabold truncate ${textPrimary}`}>{sub.name}</span>
            <span className={`block text-[11px] font-mono ${textSecondary}`}>
              ₱{Number(sub.amount).toLocaleString()} / {sub.billingCycle}
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-[11px] text-left leading-relaxed ${isLight ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
          Warning: This subscription will be permanently removed from your list. This action cannot be undone.
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${isLight ? 'border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200' : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-[0.985] transition-all cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function SubscriptionDetailModal({
  sub,
  theme,
  onClose,
  onEdit,
  onTogglePause,
  onDelete,
}) {
  const isLight = theme === 'light'
  const modalBg = isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#121418] text-[#F1F3F5] border-slate-700/40'
  const elevatedBg = isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181b20] border-[#242830]'
  const textPrimary = isLight ? 'text-slate-900 font-bold' : 'text-[#F1F3F5] font-bold'
  const textMuted = isLight ? 'text-slate-600 font-semibold' : 'text-[#64748B]'

  const monthsDiff = useMemo(() => {
    const start = new Date(sub.startDate)
    const now = new Date()
    if (isNaN(start.getTime()) || start > now) return 1
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    return Math.max(1, diffMonths + 1)
  }, [sub.startDate])

  const totalPaid = monthsDiff * Number(sub.amount)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 space-y-5 max-h-[90dvh] overflow-y-auto ${modalBg}`}
      >
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/30'}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/20 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-sm p-1.5">
              {SERVICE_SVGS[sub.name] ? (
                SERVICE_SVGS[sub.name]
              ) : (
                <span className="text-black uppercase font-bold">{sub.name.slice(0, 2)}</span>
              )}
            </div>
            <div>
              <h3 className={`text-lg font-extrabold tracking-tight ${textPrimary}`}>{sub.name}</h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sub.status === 'active'
                    ? isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-500/10 text-emerald-500'
                    : isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/10 text-amber-500'
                  }`}
              >
                {sub.status === 'active' ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-4 rounded-2xl border text-center space-y-1 ${elevatedBg}`}>
          <span className={`text-xs font-extrabold uppercase tracking-wider ${textMuted}`}>
            Deduction Amount
          </span>
          <div className={`text-3xl font-extrabold font-mono ${textPrimary}`}>
            ₱{Number(sub.amount).toLocaleString()}{' '}
            <span className={`text-xs font-sans font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              / {sub.billingCycle}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Subscription Source</span>
            <span className={`font-bold ${textPrimary}`}>{sub.source || 'Website'}</span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Start Date</span>
            <span className={`font-bold ${textPrimary}`}>{formatDateFull(sub.startDate)}</span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Current Period</span>
            <span className={`font-bold ${textPrimary}`}>
              {formatDateShort(sub.currentPeriodStart)} – {formatDateShort(sub.currentPeriodEnd)}
            </span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Next Payment Date</span>
            <span className={`font-extrabold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {formatDateFull(sub.nextBillingDate)}
            </span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Next Expected Deduction</span>
            <span className={`font-extrabold font-mono ${textPrimary}`}>₱{Number(sub.amount).toLocaleString()}</span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Billing Cycles Completed</span>
            <span className={`font-bold ${textPrimary}`}>{monthsDiff} Cycles</span>
          </div>

          <div className={`flex justify-between py-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/20'}`}>
            <span className={textMuted}>Estimated Total Paid</span>
            <span className={`font-extrabold font-mono ${textPrimary}`}>₱{totalPaid.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onEdit}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${isLight ? 'border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200' : 'border-slate-600 text-slate-200 hover:bg-slate-700/30'
              }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={onTogglePause}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${isLight ? 'border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
              }`}
          >
            {sub.status === 'active' ? (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-1">
          <button
            onClick={onDelete}
            className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${isLight ? 'border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100' : 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Subscription</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function AddEditSubscriptionModal({
  theme,
  initialSub,
  onClose,
  onSubmit,
}) {
  const isLight = theme === 'light'
  const modalBg = isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#121418] text-[#F1F3F5] border-slate-700/40'
  const inputBg = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-900'
    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
  const textMuted = isLight ? 'text-slate-600 font-semibold' : 'text-[#64748B]'

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  const [selectedService, setSelectedService] = useState(
    initialSub
      ? PREDEFINED_SERVICES.includes(initialSub.name)
        ? initialSub.name
        : 'Other'
      : 'Netflix'
  )
  const [customName, setCustomName] = useState(
    initialSub && !PREDEFINED_SERVICES.includes(initialSub.name) ? initialSub.name : ''
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [amount, setAmount] = useState(initialSub ? String(initialSub.amount) : '')
  const [source, setSource] = useState(initialSub?.source || 'Website')
  const [startDate, setStartDate] = useState(
    initialSub?.startDate && initialSub.startDate >= todayIso
      ? initialSub.startDate
      : todayIso
  )
  const [billingCycle, setBillingCycle] = useState(initialSub?.billingCycle || '1 Month')
  const [error, setError] = useState('')

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return PREDEFINED_SERVICES
    return PREDEFINED_SERVICES.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const handleDateChange = (val) => {
    if (val && val < todayIso) {
      setStartDate(todayIso)
      setError(`Past dates (e.g. before ${todayIso}) are not allowed. Date reset to today.`)
    } else {
      setStartDate(val || todayIso)
      setError('')
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setError('')

    const finalName = selectedService === 'Other' ? customName.trim() : selectedService
    if (!finalName) {
      setError('Please enter or select a subscription name.')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    if (startDate < todayIso) {
      setError(`Start date cannot be in the past (e.g. before ${todayIso}). Please select today's date or a future date.`)
      setStartDate(todayIso)
      return
    }

    const dates = calculateDates(startDate, billingCycle)

    onSubmit({
      name: finalName,
      amount: numAmount,
      source,
      startDate,
      billingCycle,
      ...dates,
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[92dvh] overflow-y-auto ${modalBg}`}
      >
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/30'}`}>
          <h3 className="text-base font-extrabold tracking-tight">
            {initialSub ? 'Edit Subscription' : 'Add Subscription'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
              What did you subscribe to?
            </label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2.5 pl-9 pr-3 rounded-xl border outline-none font-medium ${inputBg}`}
              />
            </div>

            <div className={`max-h-44 overflow-y-auto border rounded-xl p-1.5 space-y-1 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700/30 bg-black/20'
              }`}>
              {filteredServices.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => {
                    setSelectedService(service)
                    setError('')
                  }}
                  className={`w-full text-left py-2 px-3 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${selectedService === service
                      ? isLight
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white text-black font-bold'
                      : isLight
                        ? 'hover:bg-slate-200 text-slate-800 font-semibold'
                        : 'hover:bg-slate-700/20 text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/20 flex items-center justify-center font-extrabold text-[10px] shrink-0 overflow-hidden shadow-sm p-0.5">
                      {SERVICE_SVGS[service] ? (
                        SERVICE_SVGS[service]
                      ) : (
                        <span className="uppercase text-black font-bold">{service.slice(0, 2)}</span>
                      )}
                    </div>
                    <span className="truncate">{service}</span>
                  </div>

                  {selectedService === service && (
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-white' : 'text-black'}`} />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setSelectedService('Other')
                  setError('')
                }}
                className={`w-full text-left py-2 px-3 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-between ${selectedService === 'Other'
                    ? isLight
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-black'
                    : 'hover:bg-slate-700/20 text-purple-600 dark:text-purple-400'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-[10px] text-purple-600 dark:text-purple-400 shrink-0">
                    +
                  </div>
                  <span className="truncate">Other (Custom Subscription)</span>
                </div>
                {selectedService === 'Other' && (
                  <Check className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-white' : 'text-black'}`} />
                )}
              </button>
            </div>
          </div>

          {selectedService === 'Other' && (
            <div className="space-y-1.5">
              <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
                Subscription Name
              </label>
              <input
                type="text"
                placeholder="Enter subscription name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className={`w-full py-2.5 px-3.5 rounded-xl border font-semibold outline-none ${inputBg}`}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
              Amount (₱)
            </label>
            <div className="relative flex items-center">
              <span className={`absolute left-3.5 font-bold font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>₱</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="549"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full py-2.5 pl-8 pr-3 rounded-xl border font-mono font-bold outline-none ${inputBg}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
              Subscribed via
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Website', 'Google Play', 'App Store', 'Other'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSource(opt)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer truncate ${source === opt
                      ? isLight
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-black border-white'
                      : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        : 'bg-black/30 border-slate-700 text-slate-300 hover:bg-slate-700/30'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
              Start Date
            </label>
            <input
              type="date"
              min={todayIso}
              value={startDate < todayIso ? todayIso : startDate}
              onChange={(e) => handleDateChange(e.target.value)}
              onBlur={(e) => handleDateChange(e.target.value)}
              className={`w-full py-2.5 px-3.5 rounded-xl border font-semibold outline-none ${inputBg}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`block font-semibold uppercase tracking-wider ${textMuted}`}>
              Billing Cycle / Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['1 Month', '3 Months', '6 Months', '1 Year'].map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer truncate ${billingCycle === cycle
                      ? isLight
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-black border-white'
                      : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        : 'bg-black/30 border-slate-700 text-slate-300 hover:bg-slate-700/30'
                    }`}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-slate-700/30'
            }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${textMuted}`}>
              Automatic Renewal Calculation
            </span>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Next Renewal Date:</span>
              <span className={`font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {formatDateFull(calculateDates(startDate, billingCycle).nextBillingDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${isLight ? 'border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200' : 'border-slate-700 text-slate-300 hover:text-white'
                }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs shadow-md active:scale-[0.985] transition-all cursor-pointer ${isLight ? 'bg-slate-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-slate-100'
                }`}
            >
              {initialSub ? 'Save Changes' : 'Confirm Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
