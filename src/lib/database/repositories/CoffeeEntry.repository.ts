import { database } from '../Database.js'
import type { CoffeeEntry, NewCoffeeEntry } from '@/features/coffee-tracker/types/CoffeeEntry.types'

function generateUUID(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Fallback for browsers that don't support crypto.randomUUID()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

export class CoffeeEntryRepository {
  create(entry: NewCoffeeEntry): CoffeeEntry {
    const id = generateUUID()
    const now = Date.now()

    const record: CoffeeEntry = {
      id,
      brand: entry.brand,
      beanName: entry.beanName,
      createdAt: now,
    }

    const success = database.addEntry(record)
    if (!success) {
      throw new Error('Failed to save entry to database')
    }

    return record
  }

  findToday(): CoffeeEntry[] {
    return database.getTodayEntries()
  }

  delete(id: string): boolean {
    return database.deleteEntry(id)
  }
}

export const coffeeEntryRepository = new CoffeeEntryRepository()
