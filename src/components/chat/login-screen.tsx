'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Phone, User } from 'lucide-react'
import { toast } from 'sonner'

export function LoginScreen() {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast.error('Please enter your name and phone number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      if (!res.ok) throw new Error('Login failed')
      toast.success('Welcome to ZappChat!')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#25d366] flex items-center justify-center mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-[#111b21] dark:text-[#e9edef]">ZappChat</h1>
          <p className="text-[#667781] dark:text-[#8696a0] mt-2 text-sm">
            Send and receive messages without keeping your phone online.
            <br />
            Use ZappChat on up to 2 devices and 1 phone at the same time.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl p-6 space-y-4 border border-[#e9edef] dark:border-[#222e35]"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#667781] dark:text-[#8696a0] flex items-center gap-2">
              <User className="w-4 h-4" /> Your Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-4 py-3 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] placeholder:text-[#8696a0] outline-none focus:ring-2 focus:ring-[#25d366] transition"
              autoFocus
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#667781] dark:text-[#8696a0] flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone Number
            </label>
            <div className="flex items-center rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] focus-within:ring-2 focus-within:ring-[#25d366] transition">
              <span className="pl-4 pr-2 text-[#667781] dark:text-[#8696a0] font-medium select-none">
                +91
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="98765 43210"
                inputMode="numeric"
                className="w-full px-2 py-3 bg-transparent text-[#111b21] dark:text-[#e9edef] placeholder:text-[#8696a0] outline-none"
                maxLength={10}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || phone.length < 10}
            className="w-full py-3 rounded-lg bg-[#25d366] hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              'Start Chatting'
            )}
          </button>

          <p className="text-xs text-center text-[#667781] dark:text-[#8696a0] pt-2">
            Demo app — no real SMS verification. Any name &amp; 10-digit number works.
          </p>
        </form>
      </div>
    </div>
  )
}
