import { z } from 'zod'

export const CoffeeEntrySchema = z.object({
  id: z.string().uuid(),
  brand: z.string().min(1),
  beanName: z.string().min(1),
  createdAt: z.number().int().positive(),
})

export const NewCoffeeEntrySchema = z.object({
  brand: z.string().min(1).default('Starbucks'),
  beanName: z.string().min(1).default('House Blend'),
})

export type CoffeeEntry = z.infer<typeof CoffeeEntrySchema>
export type NewCoffeeEntry = z.infer<typeof NewCoffeeEntrySchema>

export const CoffeeStockSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  brand: z.string().min(1),
  beanName: z.string().min(1),
  quantity: z.number().int().min(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export type CoffeeStock = z.infer<typeof CoffeeStockSchema>

export const StockAddHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  brand: z.string().min(1),
  beanName: z.string().min(1),
  quantity: z.number().int().positive(),
  cost: z.number().nonnegative(),
  shop: z.string().min(1),
  timestamp: z.number().int().positive(),
})

export type StockAddHistory = z.infer<typeof StockAddHistorySchema>
