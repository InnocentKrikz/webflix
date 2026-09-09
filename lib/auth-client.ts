'use client'

import { createAuthClient } from 'better-auth/react'
import { phoneNumberClient, usernameClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [phoneNumberClient(), usernameClient({ displayUsername: false })],
})
