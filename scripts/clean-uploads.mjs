#!/usr/bin/env node
import { rm, stat } from 'node:fs/promises'

async function safeRm(path) {
  try {
    const s = await stat(path)
    if (s.isDirectory() || s.isFile()) {
      await rm(path, { recursive: true, force: true })
      console.log(`[clean] removed: ${path}`)
    }
  } catch {
    // ignore if not exists
  }
}

await Promise.all([
  safeRm('./public/uploads'),
  safeRm('./.open-next/assets/uploads'),
])

