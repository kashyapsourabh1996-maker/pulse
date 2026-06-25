import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Indian names + phone numbers for a WhatsApp-India style demo
const demoUsers = [
  { phone: '+919876543210', name: 'Aarav Sharma', about: 'Busy 🔥' },
  { phone: '+919876543211', name: 'Priya Patel', about: 'Available' },
  { phone: '+919876543212', name: 'Rohan Verma', about: 'At work 💼' },
  { phone: '+919876543213', name: 'Ananya Iyer', about: 'Hey there! I am using WhatsApp.' },
  { phone: '+919876543214', name: 'Vikram Nair', about: 'Coding 🚀' },
  { phone: '+919876543215', name: 'Diya Reddy', about: 'Travel ✈️' },
  { phone: '+919876543216', name: 'Arjun Mehta', about: 'Cricket 🏏' },
  { phone: '+919876543217', name: 'Sneha Gupta', about: 'Music 🎵' },
]

// Deterministic avatar color generator (used by frontend if no avatar URL)
function avatarFor(name: string) {
  return undefined // frontend generates initials avatar; keep DB null
}

async function main() {
  console.log('Seeding database...')

  // Wipe existing (careful — dev only)
  await db.storyView.deleteMany()
  await db.story.deleteMany()
  await db.message.deleteMany()
  await db.participant.deleteMany()
  await db.conversation.deleteMany()
  await db.user.deleteMany()

  // Create demo users
  const users = []
  for (const u of demoUsers) {
    const user = await db.user.create({
      data: { phone: u.phone, name: u.name, about: u.about, avatar: avatarFor(u.name) },
    })
    users.push(user)
  }
  console.log(`Created ${users.length} users`)

  // Create a "current user" placeholder — the actual logged-in user will be created on login.
  // We won't seed the current user; instead we seed conversations among demo users so that
  // after the user logs in (creating their own user record), they can start new chats.
  // But to make the demo feel alive, we'll create some conversations between demo users
  // with message history. The logged-in user will be able to see these once they start a chat.

  // Actually, to give an immediate populated experience, we create conversations where one
  // participant is a designated "demo current user" that the login screen auto-uses.
  const currentUser = await db.user.create({
    data: {
      phone: '+910000000000',
      name: 'You',
      about: 'Living the dream ✨',
    },
  })
  console.log('Created current user placeholder:', currentUser.id)

  // 1-on-1 conversations between currentUser and each of the first 6 demo users
  const now = Date.now()
  const mins = (m: number) => new Date(now - m * 60 * 1000)

  const conversationsData: Array<{
    otherUserId: string
    messages: Array<{ senderIsCurrentUser: boolean; content: string; minutesAgo: number; type?: string }>
  }> = [
    {
      otherUserId: users[0].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Hey! Are we still on for the match tomorrow? 🏏', minutesAgo: 120 },
        { senderIsCurrentUser: true, content: 'Yes definitely! 7am at the ground?', minutesAgo: 118 },
        { senderIsCurrentUser: false, content: 'Perfect. I will bring the kit.', minutesAgo: 115 },
        { senderIsCurrentUser: true, content: 'Awesome 🔥 See you then', minutesAgo: 110 },
        { senderIsCurrentUser: false, content: 'Btw did you watch the IPL highlight?', minutesAgo: 12 },
      ],
    },
    {
      otherUserId: users[1].id,
      messages: [
        { senderIsCurrentUser: true, content: 'Hi Priya, did you finish the report?', minutesAgo: 240 },
        { senderIsCurrentUser: false, content: 'Almost done! Sending it by EOD 📄', minutesAgo: 235 },
        { senderIsCurrentUser: true, content: 'Great, thanks!', minutesAgo: 230 },
      ],
    },
    {
      otherUserId: users[2].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Bhai, lunch plan?', minutesAgo: 60 },
        { senderIsCurrentUser: true, content: 'Yes! Let us go to that new South Indian place 🍛', minutesAgo: 58 },
        { senderIsCurrentUser: false, content: 'Done. 1pm?', minutesAgo: 55 },
      ],
    },
    {
      otherUserId: users[3].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Happy birthday Ananya! Wait — wrong chat 😂', minutesAgo: 30 },
        { senderIsCurrentUser: false, content: 'Sorry! Disregard 😅', minutesAgo: 29 },
      ],
    },
    {
      otherUserId: users[4].id,
      messages: [
        { senderIsCurrentUser: true, content: 'Vikram, the deploy is live 🚀', minutesAgo: 300 },
        { senderIsCurrentUser: false, content: 'Nice! Sending the PR for review now.', minutesAgo: 290 },
      ],
    },
    {
      otherUserId: users[5].id,
      messages: [
        { senderIsCurrentUser: false, content: 'Goa trip confirmed for Dec ✈️🏝️', minutesAgo: 480 },
        { senderIsCurrentUser: true, content: 'Yesss! Booking flights tonight', minutesAgo: 475 },
      ],
    },
  ]

  for (const c of conversationsData) {
    const conv = await db.conversation.create({
      data: { isGroup: false, createdBy: currentUser.id },
    })
    await db.participant.createMany({
      data: [
        { userId: currentUser.id, conversationId: conv.id, lastReadAt: new Date() },
        { userId: c.otherUserId, conversationId: conv.id },
      ],
    })
    for (const m of c.messages) {
      await db.message.create({
        data: {
          conversationId: conv.id,
          senderId: m.senderIsCurrentUser ? currentUser.id : c.otherUserId,
          content: m.content,
          type: m.type ?? 'text',
          status: 'read',
          createdAt: mins(m.minutesAgo),
        },
      })
    }
  }

  // Group conversation: "Office Squad"
  const group = await db.conversation.create({
    data: {
      name: 'Office Squad 💼',
      isGroup: true,
      about: 'Work + fun',
      createdBy: currentUser.id,
    },
  })
  await db.participant.createMany({
    data: [currentUser.id, users[1].id, users[2].id, users[4].id].map((uid) => ({
      userId: uid,
      conversationId: group.id,
      lastReadAt: new Date(),
    })),
  })
  const groupMessages: Array<{ senderId: string; content: string; minutesAgo: number }> = [
    { senderId: users[1].id, content: 'Team, standup at 10am tomorrow 📅', minutesAgo: 200 },
    { senderId: users[2].id, content: 'I will be 5 min late, joining from home', minutesAgo: 198 },
    { senderId: currentUser.id, content: 'No worries Rohan', minutesAgo: 195 },
    { senderId: users[4].id, content: 'I prepared the demo deck, sharing now 🎯', minutesAgo: 50 },
    { senderId: users[1].id, content: 'Looks great Vikram! 🔥', minutesAgo: 45 },
  ]
  for (const m of groupMessages) {
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

  // Group: "Family ❤️"
  const family = await db.conversation.create({
    data: {
      name: 'Family ❤️',
      isGroup: true,
      about: 'Home sweet home',
      createdBy: currentUser.id,
    },
  })
  await db.participant.createMany({
    data: [currentUser.id, users[3].id, users[5].id, users[6].id].map((uid) => ({
      userId: uid,
      conversationId: family.id,
      lastReadAt: new Date(),
    })),
  })
  const familyMessages: Array<{ senderId: string; content: string; minutesAgo: number }> = [
    { senderId: users[6].id, content: 'Dinner at 8pm everyone 🍽️', minutesAgo: 90 },
    { senderId: users[5].id, content: 'I will be there! Bringing dessert 🍰', minutesAgo: 85 },
    { senderId: currentUser.id, content: 'On my way home 🚗', minutesAgo: 20 },
  ]
  for (const m of familyMessages) {
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

  // Stories (status updates) — text-based with background colors
  const storyColors = ['#25D366', '#075E54', '#128C7E', '#34B7F1', '#ECE5DD']
  await db.story.create({
    data: {
      userId: users[0].id,
      content: 'Match day vibes 🏏🔥',
      type: 'text',
      bgColor: storyColors[0],
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
  })
  await db.story.create({
    data: {
      userId: users[1].id,
      content: 'Coffee before chaos ☕',
      type: 'text',
      bgColor: storyColors[2],
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 4 * 60 * 60 * 1000),
    },
  })
  await db.story.create({
    data: {
      userId: users[5].id,
      content: 'Goa calling 🏖️✈️',
      type: 'text',
      bgColor: storyColors[3],
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 6 * 60 * 60 * 1000),
    },
  })
  await db.story.create({
    data: {
      userId: users[4].id,
      content: 'Shipped a new feature today 🚀',
      type: 'text',
      bgColor: storyColors[1],
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
    },
  })

  console.log('Seeding complete!')
  console.log(`- Current user: ${currentUser.id} (${currentUser.name})`)
  console.log(`- Demo users: ${users.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
