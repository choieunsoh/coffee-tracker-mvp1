import type { CoffeeEntry } from '@/features/coffee-tracker/types/CoffeeEntry.types'
import { CoffeeEntrySchema } from '@/features/coffee-tracker/types/CoffeeEntry.types'

const STORAGE_KEY = 'coffee-tracker-entries'

export class LocalStorageDatabase {
  private safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('localStorage access failed:', error)
      return null
    }
  }

  private safeSetItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('localStorage storage failed:', error)
      return false
    }
  }

  getEntries(): CoffeeEntry[] {
    const data = this.safeGetItem(STORAGE_KEY)
    if (!data) return []

    try {
      const entries = JSON.parse(data)
      const parsedEntries = entries.map((entry: unknown) => {
        const result = CoffeeEntrySchema.safeParse(entry)
        return result.success ? result.data : null
      })

      return parsedEntries.filter(
        (entry: CoffeeEntry | null): entry is CoffeeEntry => entry !== null
      )
    } catch {
      return []
    }
  }

  saveEntries(entries: CoffeeEntry[]): boolean {
    try {
      const data = JSON.stringify(entries)
      return this.safeSetItem(STORAGE_KEY, data)
    } catch {
      return false
    }
  }

  addEntry(entry: CoffeeEntry): boolean {
    const entries = this.getEntries()
    entries.unshift(entry)
    return this.saveEntries(entries)
  }

  deleteEntry(id: string): boolean {
    const entries = this.getEntries().filter((e) => e.id !== id)
    return this.saveEntries(entries)
  }

  getTodayEntries(): CoffeeEntry[] {
    const entries = this.getEntries()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    return entries.filter((entry) => entry.createdAt >= startOfDay.getTime())
  }
}

export const database = new LocalStorageDatabase()

export async function initDatabase(): Promise<boolean> {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    }
    return true
  } catch {
    return false
  }
}
