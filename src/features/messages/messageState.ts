// Client-side read/archive state management using localStorage
// Since the API has no read/archive endpoints

const READ_KEY = 'dashboard_messages_read'
const ARCHIVE_KEY = 'dashboard_messages_archived'

function getSet(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key)
    return new Set(stored ? (JSON.parse(stored) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]))
}

export function getReadIds(): Set<string> {
  return getSet(READ_KEY)
}

export function markRead(id: string): void {
  const s = getSet(READ_KEY)
  s.add(id)
  saveSet(READ_KEY, s)
}

export function markUnread(id: string): void {
  const s = getSet(READ_KEY)
  s.delete(id)
  saveSet(READ_KEY, s)
}

export function getArchivedIds(): Set<string> {
  return getSet(ARCHIVE_KEY)
}

export function toggleArchive(id: string): boolean {
  const s = getSet(ARCHIVE_KEY)
  if (s.has(id)) {
    s.delete(id)
    saveSet(ARCHIVE_KEY, s)
    return false
  } else {
    s.add(id)
    saveSet(ARCHIVE_KEY, s)
    return true
  }
}

export function removeFromStorage(id: string): void {
  const read = getSet(READ_KEY)
  read.delete(id)
  saveSet(READ_KEY, read)

  const archived = getSet(ARCHIVE_KEY)
  archived.delete(id)
  saveSet(ARCHIVE_KEY, archived)
}
