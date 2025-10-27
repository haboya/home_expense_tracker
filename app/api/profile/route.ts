import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        password: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user without password but with hasPassword flag
    const { password, ...userWithoutPassword } = user
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        hasPassword: !!password,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update current user profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (validatedData.firstName) updateData.firstName = validatedData.firstName
    if (validatedData.lastName) updateData.lastName = validatedData.lastName
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone

    // Handle password change
    if (validatedData.newPassword) {
      if (!currentUser.password) {
        // User doesn't have a password yet (OAuth user), allow setting one without current password
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)
        updateData.password = hashedPassword
      } else {
        // User has a password, require current password to change it
        if (!validatedData.currentPassword) {
          return NextResponse.json(
            { error: 'Current password is required to change your password' },
            { status: 400 }
          )
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
          validatedData.currentPassword,
          currentUser.password
        )

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          )
        }

        updateData.password = await bcrypt.hash(validatedData.newPassword, 10)
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
