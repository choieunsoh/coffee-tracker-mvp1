import type { CoffeeStock, StockAddHistory } from '@/features/coffee-tracker/types/CoffeeEntry.types'

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

  async getStock(): Promise<CoffeeStock[]> {
    const response = await fetch(`${API_BASE}/api/stock`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stock')
    }

    return response.json() as Promise<CoffeeStock[]>
  }

  async addStock(brand: string, beanName: string, quantity: number, cost: number, shop: string): Promise<CoffeeStock> {
    const response = await fetch(`${API_BASE}/api/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, beanName, quantity, cost, shop }),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add stock')
    }

    return response.json() as Promise<CoffeeStock>
  }

  async getStockHistory(limit?: number): Promise<StockAddHistory[]> {
    const url = limit ? `${API_BASE}/api/stock-history?limit=${limit}` : `${API_BASE}/api/stock-history`
    const response = await fetch(url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stock history')
    }

    return response.json() as Promise<StockAddHistory[]>
  }

  async consumeStock(brand: string, beanName: string): Promise<{ success: boolean; remaining: number }> {
    const response = await fetch(`${API_BASE}/api/stock/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, beanName }),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to consume stock')
    }

    return response.json() as Promise<{ success: boolean; remaining: number }>
  }

  async restoreStock(brand: string, beanName: string): Promise<{ success: boolean; remaining: number }> {
    const response = await fetch(`${API_BASE}/api/stock/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, beanName }),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to restore stock')
    }

    return response.json() as Promise<{ success: boolean; remaining: number }>
  }
}

export const apiClient = new CoffeeApiClient()
