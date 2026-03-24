import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { DEFAULT_COFFEE_TYPE } from '@/config/app.config'
import type { CoffeeStock } from '../types/CoffeeEntry.types'

type UseStockReturn = {
  stock: CoffeeStock | null
  isLoading: boolean
  isAdding: boolean
  error: string | null
  addStock: (quantity: number) => Promise<void>
  consumeStock: () => Promise<boolean>
  refreshStock: () => Promise<void>
}

export function useStock(): UseStockReturn {
  const [stock, setStock] = useState<CoffeeStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStock = useCallback(async () => {
    try {
      console.log('[useStock] Loading stock...')
      const stocks = await apiClient.getStock()

      // Find stock for default coffee type
      const defaultStock = stocks.find(
        s => s.brand === DEFAULT_COFFEE_TYPE.brand && s.beanName === DEFAULT_COFFEE_TYPE.beanName
      )

      setStock(defaultStock || null)
      setError(null)
    } catch (err) {
      console.error('Failed to load stock:', err)
      setError('Failed to load stock from server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStock()
  }, [loadStock])

  const addStock = useCallback(async (quantity: number) => {
    if (isAdding) return

    console.log('[useStock] Adding stock:', quantity)
    setIsAdding(true)
    setError(null)

    try {
      const newStock = await apiClient.addStock(
        DEFAULT_COFFEE_TYPE.brand,
        DEFAULT_COFFEE_TYPE.beanName,
        quantity
      )
      console.log('[useStock] Stock added:', newStock.quantity)
      setStock(newStock)
    } catch (err) {
      console.error('Failed to add stock:', err)
      setError(err instanceof Error ? err.message : 'Failed to add stock')
      throw err
    } finally {
      setIsAdding(false)
    }
  }, [isAdding])

  const consumeStock = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useStock] Consuming stock...')
      const result = await apiClient.consumeStock(
        DEFAULT_COFFEE_TYPE.brand,
        DEFAULT_COFFEE_TYPE.beanName
      )

      if (stock) {
        setStock({ ...stock, quantity: result.remaining, updatedAt: Date.now() })
      }

      console.log('[useStock] Stock consumed, remaining:', result.remaining)
      return true
    } catch (err) {
      console.error('Failed to consume stock:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to consume stock'
      setError(errorMessage)
      return false
    }
  }, [stock])

  return {
    stock,
    isLoading,
    isAdding,
    error,
    addStock,
    consumeStock,
    refreshStock: loadStock,
  }
}
