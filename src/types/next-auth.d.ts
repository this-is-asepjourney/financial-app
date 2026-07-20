import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      monthlyIncome?: number | null
      currency?: string | null
      paydayDate?: number | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    monthlyIncome?: number | null
    currency?: string | null
    paydayDate?: number | null
  }
}
