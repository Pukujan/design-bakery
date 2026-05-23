#!/usr/bin/env node
/**
 * Hash a password for ADMIN_PASSWORD_HASH in backend/.env
 * Usage: pnpm --dir backend exec node scripts/hash-admin-password.mjs 'your-password'
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error("Usage: pnpm --dir backend exec node scripts/hash-admin-password.mjs 'your-password'");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(hash);
