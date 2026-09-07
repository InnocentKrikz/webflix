'use client'

import { createAuthClient } from 'better-auth/react'
import { phoneNumberClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3005',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [phoneNumberClient()],
})
