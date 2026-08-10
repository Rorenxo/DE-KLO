import Dexie from 'dexie'

export const offlineDatabase = new Dexie('deklo-offline-store')

offlineDatabase.version(1).stores({
  transactions: 'id, user_id, sync_status, transaction_date, updated_at',
})

offlineDatabase.version(2).stores({
  transactions: 'id, user_id, sync_status, transaction_date, updated_at',
  savings_goals: 'id, user_id, sync_status, created_at, updated_at',
  recurring_transactions: 'id, user_id, sync_status, created_at, updated_at',
  sync_operations: '++id, user_id, entity, entity_id, status, created_at',
})

offlineDatabase.version(3).stores({
  transactions: 'id, user_id, sync_status, transaction_date, updated_at',
  savings_goals: 'id, user_id, sync_status, created_at, updated_at',
  recurring_transactions: 'id, user_id, sync_status, created_at, updated_at',
  profiles: 'user_id, sync_status, updated_at',
  sync_operations: '++id, user_id, entity, entity_id, status, created_at',
})

export function createLocalId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function enqueueOperation(operation) {
  return offlineDatabase.sync_operations.add({
    ...operation,
    status: 'pending',
    created_at: new Date().toISOString(),
  })
}
