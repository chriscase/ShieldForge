#!/usr/bin/env node
/**
 * Generate per-member RS256 keypairs for a ShieldForge SSO realm.
 *
 * Run this LOCALLY. Place each member's PRIVATE key in that member's own env /
 * secret store (never commit it). The PUBLIC JWKs are safe to commit and are
 * what each member pins in its verifier roster (peers pin each other).
 *
 * Usage:
 *   node scripts/generate-realm-keys.mjs <realmId> <memberId> [<memberId> ...]
 *
 * Example (the first instance — symmetric pair):
 *   node scripts/generate-realm-keys.mjs mystrangemind \
 *     urn:sfrealm:mystrangemind:www urn:sfrealm:mystrangemind:wiki
 */
import { generateKeyPair, exportPKCS8, exportJWK, calculateJwkThumbprint } from 'jose';

const [realmId, ...memberIds] = process.argv.slice(2);
if (!realmId || memberIds.length === 0) {
  console.error('Usage: node scripts/generate-realm-keys.mjs <realmId> <memberId> [<memberId> ...]');
  process.exit(1);
}

const members = [];
for (const memberId of memberIds) {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const privateKeyPem = await exportPKCS8(privateKey);
  const publicJwk = await exportJWK(publicKey);
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  publicJwk.kid = await calculateJwkThumbprint(publicJwk, 'sha256');
  members.push({ memberId, privateKeyPem, publicJwk });
}

console.log(`\n========== Realm: ${realmId} ==========\n`);
for (const m of members) {
  console.log(`--- member: ${m.memberId} ---`);
  console.log(`PRIVATE KEY  →  place in THIS member's env (e.g. SF_REALM_PRIVATE_KEY). DO NOT COMMIT.`);
  console.log(m.privateKeyPem);
  console.log(`PUBLIC JWK   →  safe to commit; peers pin this in their roster:`);
  console.log(JSON.stringify(m.publicJwk));
  console.log('');
}

console.log('========== Public roster (safe to share/commit) ==========');
console.log('Each member configures its realm with this realmId + the OTHER members as roster peers.');
console.log(
  JSON.stringify(
    { realmId, members: members.map((m) => ({ id: m.memberId, publicJwks: [m.publicJwk] })) },
    null,
    2,
  ),
);
console.log('');
console.log('Next: give me back ONLY the public roster JSON (no private keys) so I can wire it into MSM + OMS.');
