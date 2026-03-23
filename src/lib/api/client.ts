const API_BASE = window.location.origin

export interface CoffeeEntry {
  id: string
  userId: string
  brand: string
  beanName: string
  createdAt: number
}

export class CoffeeApiClient {
  async getTodayEntries(startDate?: number): Promise<CoffeeEntry[]> {
    const url = startDate
      ? `${API_BASE}/api/entries?startDate=${startDate}`
      : `${API_BASE}/api/entries`
    const response = await fetch(url, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch entries')
    return response.json()
  }

  async addEntry(brand: string, beanName: string): Promise<CoffeeEntry> {
    const response = await fetch(`${API_BASE}/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, beanName }),
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to add entry')
    return response.json()
  }

  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/entries/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to delete entry')
  }

  async updateEntry(id: string, createdAt: number): Promise<CoffeeEntry> {
    const response = await fetch(`${API_BASE}/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdAt }),
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to update entry')
    const data = await response.json()
    return data.entry
  }
}

export const apiClient = new CoffeeApiClient()
