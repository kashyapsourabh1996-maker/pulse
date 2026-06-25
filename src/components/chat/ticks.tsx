'use client'

import { Check, CheckCheck } from 'lucide-react'

// WhatsApp-style message status ticks
export function MessageTicks({ status }: { status: string }) {
  if (status === 'sent') {
    return <Check className="w-4 h-4 text-[#8696a0]" strokeWidth={2.5} />
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-4 h-4 text-[#8696a0]" strokeWidth={2.5} />
  }
  if (status === 'read') {
    return <CheckCheck className="w-4 h-4 text-[#53bdeb]" strokeWidth={2.5} />
  }
  return null
}
