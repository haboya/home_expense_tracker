import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateUserId } from './user-id-generator'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.password) {
          throw new Error('No password set for this account. Please sign in with Google to set a password.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/set-password', // Redirect here after first Google sign-in
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          if (!existingUser) {
            // Create new user account on first Google sign-in
            const names = (profile.name || '').split(' ')
            const firstName = names[0] || 'User'
            const lastName = names.slice(1).join(' ') || ''

            const userId = await generateUserId()

            await prisma.user.create({
              data: {
                id: userId,
                email: profile.email,
                firstName,
                lastName,
                password: null, // No password initially for OAuth users
                role: 'user', // Default role for OAuth users
              },
            })
            
            console.log('New user created via Google OAuth:', profile.email)
          }
        } catch (error) {
          console.error('Error handling Google sign-in:', error)
          // Don't block sign-in, the error will be logged
          // User can try again or contact admin
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // On sign-in, fetch user data from database
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.name = `${dbUser.firstName} ${dbUser.lastName}`
        } else {
          console.error('User not found in database after Google sign-in:', token.email)
        }
      } else if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
