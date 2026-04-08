export type Role = 'USER' | 'ORGANIZER' | 'ADMIN'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type Gateway = 'RAZORPAY' | 'PAYPAL'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Ticket {
  id: string
  eventId: string
  tier: string
  price: number
  capacity: number
  sold: number
}

export interface Event {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  category: string
  imageUrl: string | null
  isActive: boolean
  organizerId: string
  tickets: Ticket[]
  organizer?: { name: string }
}

export interface Payment {
  id: string
  orderId: string
  gateway: Gateway
  status: PaymentStatus
  transactionId: string | null
}

export interface Order {
  id: string
  userId: string
  eventId: string
  ticketId: string
  quantity: number
  total: number
  qrCode: string | null
  paymentStatus: PaymentStatus
  event: Event
  ticket: Ticket
  payment: Payment | null
  createdAt: string
}

export interface Promotion {
  id: string
  code: string
  discount: number
  expiration: string
  isActive: boolean
}

export interface SalesData {
  orders: (Order & { user: Pick<User, 'name' | 'email'> })[]
  totalRevenue: number
  totalTickets: number
}
