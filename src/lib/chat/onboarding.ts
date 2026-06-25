import { db } from '@/lib/db'

/**
 * When a user logs in for the first time and has no conversations, create a
 * set of demo conversations (one-on-one + groups) with the seeded demo users
 * so the chat list isn't empty. Idempotent — only acts if the user has 0 convos.
 */
export async function onboardNewUser(userId: string) {
  const existing = await db.participant.count({ where: { userId } })
  if (existing > 0) return

  // Find demo users (everyone except this user). Prefer seeded Indian demo users.
  const demoUsers = await db.user.findMany({
    where: { id: { not: userId } },
    take: 8,
    orderBy: { createdAt: 'asc' },
  })
  if (demoUsers.length === 0) return

  const now = Date.now()
  const mins = (m: number) => new Date(now - m * 60 * 1000)

  const oneOnOnes: Array<{
    otherUserId: string
    messages: Array<{ senderIsCurrentUser: boolean; content: string; minutesAgo: number; type?: string }>
  }> = [
    {
      otherUserId: demoUsers[0].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Hey! Are we still on for the match tomorrow? 🏏', minutesAgo: 120 },
        { senderIsCurrentUser: true, content: 'Yes definitely! 7am at the ground?', minutesAgo: 118 },
        { senderIsCurrentUser: false, content: 'Perfect. I will bring the kit.', minutesAgo: 115 },
        { senderIsCurrentUser: true, content: 'Awesome 🔥 See you then', minutesAgo: 110 },
        { senderIsCurrentUser: false, content: 'Btw did you watch the IPL highlight?', minutesAgo: 12 },
      ],
    },
    {
      otherUserId: demoUsers[1].id,
      messages: [
        { senderIsCurrentUser: true, content: 'Hi! Did you finish the report?', minutesAgo: 240 },
        { senderIsCurrentUser: false, content: 'Almost done! Sending it by EOD 📄', minutesAgo: 235 },
        { senderIsCurrentUser: true, content: 'Great, thanks!', minutesAgo: 230 },
      ],
    },
    {
      otherUserId: demoUsers[2].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Bhai, lunch plan?', minutesAgo: 60 },
        { senderIsCurrentUser: true, content: 'Yes! Let us go to that new South Indian place 🍛', minutesAgo: 58 },
        { senderIsCurrentUser: false, content: 'Done. 1pm?', minutesAgo: 55 },
      ],
    },
    {
      otherUserId: demoUsers[3].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Happy birthday! Wait — wrong chat 😂', minutesAgo: 30 },
        { senderIsCurrentUser: false, content: 'Sorry! Disregard 😅', minutesAgo: 29 },
      ],
    },
    {
      otherUserId: demoUsers[4].id,
      messages: [
        { senderIsCurrentUser: true, content: 'The deploy is live 🚀', minutesAgo: 300 },
        { senderIsCurrentUser: false, content: 'Nice! Sending the PR for review now.', minutesAgo: 290 },
      ],
    },
    {
      otherUserId: demoUsers[5].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Goa trip confirmed for Dec ✈️🏝️', minutesAgo: 480 },
        { senderIsCurrentUser: true, content: 'Yesss! Booking flights tonight', minutesAgo: 475 },
      ],
    },
  ]

  for (const c of oneOnOnes) {
    if (!demoUsers.find((u) => u.id === c.otherUserId)) continue
    const conv = await db.conversation.create({
      data: { isGroup: false, createdBy: userId },
    })
    await db.participant.createMany({
      data: [
        { userId, conversationId: conv.id, lastReadAt: new Date() },
        { userId: c.otherUserId, conversationId: conv.id },
      ],
    })
    for (const m of c.messages) {
      await db.message.create({
        data: {
          conversationId: conv.id,
          senderId: m.senderIsCurrentUser ? userId : c.otherUserId,
          content: m.content,
          type: m.type ?? 'text',
          status: 'read',
          createdAt: mins(m.minutesAgo),
        },
      })
    }
  }

  // Group: Office Squad
  if (demoUsers.length >= 5) {
    const group = await db.conversation.create({
      data: { name: 'Office Squad 💼', isGroup: true, about: 'Work + fun', createdBy: userId },
    })
    await db.participant.createMany({
      data: [userId, demoUsers[1].id, demoUsers[2].id, demoUsers[4].id].map((uid) => ({
        userId: uid,
        conversationId: group.id,
        lastReadAt: new Date(),
      })),
    })
    const groupMsgs: Array<{ senderId: string; content: string; minutesAgo: number }> = [
      { senderId: demoUsers[1].id, content: 'Team, standup at 10am tomorrow 📅', minutesAgo: 200 },
      { senderId: demoUsers[2].id, content: 'I will be 5 min late, joining from home', minutesAgo: 198 },
      { senderId: userId, content: 'No worries', minutesAgo: 195 },
      { senderId: demoUsers[4].id, content: 'I prepared the demo deck, sharing now 🎯', minutesAgo: 50 },
      { senderId: demoUsers[1].id, content: 'Looks great! 🔥', minutesAgo: 45 },
    ]
    for (const m of groupMsgs) {
      await db.message.create({
        data: {
          conversationId: group.id,
          senderId: m.senderId,
          content: m.content,
          type: 'text',
          status: 'read',
          createdAt: mins(m.minutesAgo),
        },
      })
    }
  }

  // Group: Family
  if (demoUsers.length >= 7) {
    const family = await db.conversation.create({
      data: { name: 'Family ❤️', isGroup: true, about: 'Home sweet home', createdBy: userId },
    })
    await db.participant.createMany({
      data: [userId, demoUsers[3].id, demoUsers[5].id, demoUsers[6].id].map((uid) => ({
        userId: uid,
        conversationId: family.id,
        lastReadAt: new Date(),
      })),
    })
    const familyMsgs: Array<{ senderId: string; content: string; minutesAgo: number }> = [
      { senderId: demoUsers[6].id, content: 'Dinner at 8pm everyone 🍽️', minutesAgo: 90 },
      { senderId: demoUsers[5].id, content: 'I will be there! Bringing dessert 🍰', minutesAgo: 85 },
      { senderId: userId, content: 'On my way home 🚗', minutesAgo: 20 },
    ]
    for (const m of familyMsgs) {
      await db.message.create({
        data: {
          conversationId: family.id,
          senderId: m.senderId,
          content: m.content,
          type: 'text',
          status: 'read',
          createdAt: mins(m.minutesAgo),
        },
      })
    }
  }
}
