import { Router } from 'express'
import { google } from 'googleapis'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'
import { getAuthedGoogleClient, syncGoogleQuota } from '../google/google.service.js'
import argon2 from 'argon2'

export const folderRouter = Router()
folderRouter.use(requireAuth)

const defaultFolderColor = '#3b82f6'
const defaultFolderIconUrl = 'https://api.iconify.design/lucide:folder.svg'
const iconUrlSchema = z.string().url().startsWith('https://api.iconify.design/lucide:').max(2048)
const colorSchema = z.string().regex(/^(#[0-9a-fA-F]{6}|text-[a-z]+-[0-9]+)$/).max(64)

const createSchema = z.object({
  name: z.string().min(1).max(255),
  color: colorSchema.optional(),
  iconUrl: iconUrlSchema.nullable().optional(),
  parentId: z.string().nullable().optional(),
})

export async function verifyFolderAccess(folderId: string, userId: string, headers: any): Promise<boolean> {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId, deletedAt: null } })
  if (!folder) return false
  if (!folder.isLocked || !folder.password) return true

  const folderPasswordsRaw = headers['x-folder-passwords']
  if (!folderPasswordsRaw) return false

  try {
    const passwords = JSON.parse(folderPasswordsRaw)
    const password = passwords[folderId]
    if (!password) return false
    return await argon2.verify(folder.password, password)
  } catch {
    return false
  }
}

function serializeFolder(folder: { id: string; name: string; color: string; iconUrl?: string | null; parentId?: string | null; createdAt: Date; updatedAt: Date; isLocked?: boolean }) {
  return { ...folder, createdAt: folder.createdAt.toISOString(), updatedAt: folder.updatedAt.toISOString(), isLocked: folder.isLocked ?? false }
}

folderRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({ parentId: z.string().nullable().optional(), all: z.string().optional() }).parse(req.query)
    
    if (query.parentId) {
      const hasAccess = await verifyFolderAccess(query.parentId, req.user!.id, req.headers)
      if (!hasAccess) return res.status(403).json({ code: 'FOLDER_LOCKED', message: 'Folder is locked.' })
    }

    const folders = await prisma.folder.findMany({
      where: { userId: req.user!.id, deletedAt: null, ...(query.all === '1' ? {} : { parentId: query.parentId ?? null }) },
      select: { id: true, name: true, color: true, iconUrl: true, parentId: true, isLocked: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    return res.json({ folders: folders.map(serializeFolder) })
  } catch (error) {
    return next(error)
  }
})

folderRouter.get('/recent', async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 4), 4)
    const folders = await prisma.folder.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      select: { id: true, name: true, color: true, iconUrl: true, parentId: true, isLocked: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
    return res.json({ folders: folders.map(serializeFolder) })
  } catch (error) {
    return next(error)
  }
})

folderRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    if (body.parentId) await prisma.folder.findFirstOrThrow({ where: { id: body.parentId, userId: req.user!.id, deletedAt: null } })
    const folder = await prisma.folder.create({
      data: { userId: req.user!.id, name: body.name, color: body.color ?? defaultFolderColor, iconUrl: body.iconUrl ?? defaultFolderIconUrl, parentId: body.parentId ?? null },
      select: { id: true, name: true, color: true, iconUrl: true, parentId: true, isLocked: true, createdAt: true, updatedAt: true },
    })
    return res.status(201).json({ folder: serializeFolder(folder) })
  } catch (error) {
    return next(error)
  }
})

folderRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = createSchema.partial().parse(req.body)
    const folderId = String(req.params.id)
    if (body.parentId === folderId) return res.status(400).json({ code: 'FOLDER_INVALID_PARENT', message: 'Folder cannot be moved into itself.' })

    if (body.parentId) {
      await prisma.folder.findFirstOrThrow({ where: { id: body.parentId, userId: req.user!.id, deletedAt: null } })
      const folders = await prisma.folder.findMany({ where: { userId: req.user!.id, deletedAt: null }, select: { id: true, parentId: true } })
      const descendantIds = new Set<string>([folderId])
      let changed = true
      while (changed) {
        changed = false
        for (const folder of folders) {
          if (folder.parentId && descendantIds.has(folder.parentId) && !descendantIds.has(folder.id)) {
            descendantIds.add(folder.id)
            changed = true
          }
        }
      }
      if (descendantIds.has(body.parentId)) return res.status(400).json({ code: 'FOLDER_INVALID_PARENT', message: 'Folder cannot be moved into itself or a child folder.' })
    }

    const folder = await prisma.folder.updateMany({
      where: { id: folderId, userId: req.user!.id, deletedAt: null },
      data: { ...(body.name ? { name: body.name } : {}), ...(body.color ? { color: body.color } : {}), ...(body.iconUrl !== undefined ? { iconUrl: body.iconUrl } : {}), ...(body.parentId !== undefined ? { parentId: body.parentId } : {}) },
    })
    if (folder.count === 0) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
    const updated = await prisma.folder.findFirstOrThrow({
      where: { id: folderId, userId: req.user!.id },
      select: { id: true, name: true, color: true, iconUrl: true, parentId: true, isLocked: true, createdAt: true, updatedAt: true },
    })
    return res.json({ folder: serializeFolder(updated) })
  } catch (error) {
    return next(error)
  }
})

folderRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const rootId = String(req.params.id)
    const root = await prisma.folder.findFirstOrThrow({ where: { id: rootId, userId: req.user!.id, deletedAt: null } })
    const folders = await prisma.folder.findMany({ where: { userId: req.user!.id, deletedAt: null }, select: { id: true, parentId: true } })
    const folderIds = new Set<string>([root.id])
    let changed = true
    while (changed) {
      changed = false
      for (const folder of folders) {
        if (folder.parentId && folderIds.has(folder.parentId) && !folderIds.has(folder.id)) {
          folderIds.add(folder.id)
          changed = true
        }
      }
    }

    const files = await prisma.file.findMany({ where: { userId: req.user!.id, status: 'active', folderId: { in: [...folderIds] } }, include: { connectedAccount: true } })
    const syncedAccountIds = new Set<string>()
    for (const file of files) {
      try {
        const auth = await getAuthedGoogleClient(file.connectedAccount)
        const drive = google.drive({ version: 'v3', auth })
        await drive.files.delete({ fileId: file.providerFileId })
        syncedAccountIds.add(file.connectedAccountId)
      } catch {
        // Keep going so one provider failure does not leave the whole folder undeleted.
      }
    }

    await prisma.file.updateMany({ where: { id: { in: files.map((file) => file.id) } }, data: { status: 'deleted', deletedAt: new Date() } })
    await prisma.folder.updateMany({ where: { id: { in: [...folderIds] }, userId: req.user!.id }, data: { deletedAt: new Date() } })
    for (const accountId of syncedAccountIds) await syncGoogleQuota(accountId).catch(() => undefined)
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

const lockSchema = z.object({
  password: z.string().min(1).max(255)
})

folderRouter.post('/:id/lock', async (req: AuthRequest, res, next) => {
  try {
    const { password } = lockSchema.parse(req.body)
    const folderId = String(req.params.id)
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user!.id, deletedAt: null } })
    if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })

    const hashedPassword = await argon2.hash(password)
    await prisma.folder.update({
      where: { id: folder.id },
      data: { isLocked: true, password: hashedPassword }
    })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

folderRouter.post('/:id/unlock', async (req: AuthRequest, res, next) => {
  try {
    const { password } = lockSchema.parse(req.body)
    const folderId = String(req.params.id)
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user!.id, deletedAt: null } })
    if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
    if (!folder.isLocked || !folder.password) return res.status(400).json({ code: 'NOT_LOCKED', message: 'Folder is not locked.' })

    const valid = await argon2.verify(folder.password, password)
    if (!valid) return res.status(403).json({ code: 'INVALID_PASSWORD', message: 'Incorrect password.' })

    await prisma.folder.update({
      where: { id: folder.id },
      data: { isLocked: false, password: null }
    })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

folderRouter.post('/:id/verify-password', async (req: AuthRequest, res, next) => {
  try {
    const { password } = lockSchema.parse(req.body)
    const folderId = String(req.params.id)
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user!.id, deletedAt: null } })
    if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })
    if (!folder.isLocked || !folder.password) return res.json({ valid: true })

    const valid = await argon2.verify(folder.password, password)
    return res.json({ valid })
  } catch (error) {
    return next(error)
  }
})

folderRouter.post('/:id/reset-lock', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (user?.email !== 'febnicobayu.42@gmail.com') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only admin can reset lock.' })
    }
    const folderId = String(req.params.id)
    const folder = await prisma.folder.findFirst({ where: { id: folderId, deletedAt: null } })
    if (!folder) return res.status(404).json({ code: 'FOLDER_NOT_FOUND', message: 'Folder not found.' })

    await prisma.folder.update({
      where: { id: folder.id },
      data: { isLocked: false, password: null }
    })
    return res.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})
