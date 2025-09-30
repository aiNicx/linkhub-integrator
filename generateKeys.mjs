import { generateKeyPair, exportJWK, exportPKCS8 } from "jose";

const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
const jwk = await exportJWK(publicKey);
const pkcs8 = await exportPKCS8(privateKey);

console.log('=== FORMATO STANDARD (con \\n escaped) ===');
console.log('CONVEX_AUTH_PRIVATE_KEY="' + pkcs8.replace(/\n/g, '\\n') + '"');
console.log('');

console.log('=== FORMATO BASE64 (per Vercel se il primo non funziona) ===');
console.log('CONVEX_AUTH_PRIVATE_KEY="' + Buffer.from(pkcs8).toString('base64') + '"');
console.log('');

console.log('=== JWKS per Convex Dashboard ===');
console.log('JWKS=\'{"keys":[' + JSON.stringify({...jwk, use: "sig", alg: "RS256"}) + ']}\'');