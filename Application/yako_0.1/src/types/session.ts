export type Cinema = {
  id: number
  name: string
  address: string
  city?: string
  postal_code?: string
}

export type MovieSession = {
  id: number
  starts_at: string
  projection?: string
  version?: string
  booking_url?: string
  cinema: Cinema
}