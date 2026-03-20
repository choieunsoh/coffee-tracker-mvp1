import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
// import { onNewEntry, onDeleteEntry } from '@/lib/api/websocket';
import { DEFAULT_COFFEE_TYPE } from '@/config/app.config'
import { getTodayStart } from '@/shared/utils/date'
import type { CoffeeEntry } from '../types/CoffeeEntry.types'

export function useCoffeeEntries() {
  const [todayEntries, setTodayEntries] = useState<CoffeeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const pendingEntryIdRef = useRef<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      console.log('Loading entries from server...')
      const startDate = getTodayStart()
      const entries = await apiClient.getTodayEntries(startDate)
      console.log('Loaded entries:', entries)
      setTodayEntries(entries)
      setError(null)
    } catch (err) {
      console.error('Failed to load entries:', err)
      setError('Failed to load entries from server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // WEBSOCKET DISABLED FOR DEBUGGING
  // Real-time sync: Listen for new entries from other devices
  // useEffect(() => {
  //   console.log('[useEffect] Setting up WebSocket listener');
  //   const unsubscribe = onNewEntry((newEntry) => {
  //     console.log('[WebSocket] Received new entry:', newEntry.id);
  //     console.log('[WebSocket] Pending ID:', pendingEntryIdRef.current);

  //     // Ignore if this is the entry we just created locally
  //     if (pendingEntryIdRef.current === newEntry.id) {
  //       console.log('[WebSocket] IGNORING - this is our entry');
  //       pendingEntryIdRef.current = null;
  //       return;
  //     }

  //     console.log('[WebSocket] ADDING - from another device');
  //     setTodayEntries(prevEntries => [newEntry, ...prevEntries]);
  //   });

  //   return unsubscribe;
  // }, []);

  // // Real-time sync: Listen for deletions from other devices
  // useEffect(() => {
  //   const unsubscribe = onDeleteEntry((deletedId) => {
  //     console.log('Real-time: Entry deleted from another device:', deletedId);
  //     setTodayEntries(prevEntries => prevEntries.filter(entry => entry.id !== deletedId));
  //   });

  //   return unsubscribe;
  // }, []);

  const addEntry = useCallback(async () => {
    if (isAdding) {
      console.log('[addEntry] Already adding, returning')
      return
    }

    console.log('[addEntry] Starting addEntry...')
    setIsAdding(true)
    setError(null)

    try {
      console.log('[addEntry] Calling API...')
      const newEntry = await apiClient.addEntry(
        DEFAULT_COFFEE_TYPE.brand,
        DEFAULT_COFFEE_TYPE.beanName
      )
      console.log('[addEntry] Created entry:', newEntry.id)

      // Optimistic update (NO WebSocket echo anymore)
      console.log('[addEntry] Optimistic update - adding to state')
      setTodayEntries((prevEntries) => {
        console.log('[addEntry] Current entries:', prevEntries.length)
        return [newEntry, ...prevEntries]
      })
    } catch (err) {
      console.error('Failed to add entry:', err)
      setError('Failed to add coffee entry')
      // Reload to get correct state
      loadEntries()
    } finally {
      setIsAdding(false)
    }
  }, [isAdding, loadEntries])

  return {
    todayEntries,
    count: todayEntries.length,
    addEntry,
    isLoading,
    isAdding,
    error,
  }
}
