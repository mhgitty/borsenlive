import { fetchHourlyPrices } from '@/lib/elpris-api'
import { PriceTickerClient } from './PriceTickerClient'

/** Live price ribbon above the header: today's hourly total prices for Vest/Øst. */
export async function PriceTicker() {
  const [dk1, dk2] = await Promise.all([
    fetchHourlyPrices('DK1').catch(() => []),
    fetchHourlyPrices('DK2').catch(() => []),
  ])
  if (!dk1.length && !dk2.length) return null
  return <PriceTickerClient dk1={dk1.map((h) => h.price)} dk2={dk2.map((h) => h.price)} />
}
