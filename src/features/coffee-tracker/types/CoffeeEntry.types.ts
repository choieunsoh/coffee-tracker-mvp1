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
