import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ProjectService, UserService } from '@/lib/database'
import { z } from 'zod'

// Validation schema for project creation
const projectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.record(z.unknown()).optional(),
})

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await UserService.getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = projectCreateSchema.parse(body)

    // Create project
    const project = await ProjectService.createProject(user.id, validatedData)
    
    return NextResponse.json({ 
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        isPrivate: project.isPrivate,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: {
          id: project.owner.id,
          displayName: project.owner.displayName || project.owner.firstName,
          avatar: project.owner.avatar
        },
        memberCount: project.members.length
      }
    })
  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// GET /api/projects - Get user's projects
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await UserService.getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's projects
    const userProjects = await ProjectService.getUserProjects(user.id)
    
    if (!userProjects) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Format response
    const ownedProjects = userProjects.ownedProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      isPrivate: project.isPrivate,
      role: 'OWNER',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: project._count.members,
      fileCount: project._count.files,
      messageCount: project._count.messages
    }))

    const memberProjects = userProjects.projectMembers.map(member => ({
      id: member.project.id,
      name: member.project.name,
      description: member.project.description,
      isPrivate: member.project.isPrivate,
      role: member.role,
      joinedAt: member.joinedAt,
      createdAt: member.project.createdAt,
      updatedAt: member.project.updatedAt,
      owner: {
        id: member.project.owner.id,
        displayName: member.project.owner.displayName || member.project.owner.firstName,
        avatar: member.project.owner.avatar
      },
      memberCount: member.project._count.members,
      fileCount: member.project._count.files,
      messageCount: member.project._count.messages
    }))

    return NextResponse.json({
      ownedProjects,
      memberProjects,
      totalProjects: ownedProjects.length + memberProjects.length
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
} 