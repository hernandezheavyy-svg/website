#!/usr/bin/env node
/**
 * Usage: node scripts/hash-password.js yourpassword
 * Outputs a bcrypt hash to paste into .env.local as PANEL_PASSWORD_HASH
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("\nPaste this into .env.local:\n");
  console.log(`PANEL_PASSWORD_HASH=${hash}\n`);
});
