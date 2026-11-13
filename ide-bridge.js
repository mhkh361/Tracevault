#!/usr/bin/env node

/**
 * TraceVault - IDE Extension & Command-Line Bridge CLI
 * 
 * Usage:
 *   node ide-bridge.js "<tech_stack>" "<error_message_or_trace>" [domain_id] [file_path]
 * 
 * Examples:
 *   node ide-bridge.js "React" "Cannot read properties of undefined (reading 'map')"
 *   node ide-bridge.js "Node.js" "Error: listen EADDRINUSE: address already in use :::3000"
 */

const http = require('http');

const techStack = process.argv[2];
const errorOutput = process.argv[3];
const domainId = parseInt(process.argv[4] || '0', 10);
const filePath = process.argv[5] || '';

if (!techStack || !errorOutput) {
  console.log(`
┌──────────────────────────────────────────────────────────────┐
│  ⚡ TraceVault IDE & Terminal Debug Bridge                    │
└──────────────────────────────────────────────────────────────┘
Usage:
  node ide-bridge.js "<tech_stack>" "<error_message>" [domain_id] [file_path]

Examples:
  node ide-bridge.js "React" "Cannot read properties of undefined"
  node ide-bridge.js "Node.js" "Error: listen EADDRINUSE :::3000"
`);
  process.exit(1);
}

const payload = JSON.stringify({
  tech_stack: techStack,
  error_output: errorOutput,
  domain_id: domainId,
  file_path: filePath
});

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/ide/diagnose',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (json.matched && json.record) {
        const r = json.record;
        console.log(`
======================================================================
⚡ TRACEVAULT MATCH FOUND IN VAULT (0 AI Tokens Used)
======================================================================
Record ID : #${r.error_id} [${r.tech_stack}]
Times Hit : ${r.times_hit} times resolved
Verified  : ${r.is_verified ? '✓ Verified Solution' : '⏳ Unverified'}
Signature : ${r.error_signature}
Root Cause: ${r.root_cause || 'Identified in local knowledge base.'}
----------------------------------------------------------------------
FIX REQUIREMENTS & CODE SOLUTION:
${r.fix_requirements}
======================================================================
View in browser: http://localhost:3000
`);
        process.exit(0);
      } else {
        console.log(`
======================================================================
ℹ️  TRACEVAULT: NO EXISTING LOCAL MATCH FOUND
======================================================================
Tech Stack : ${techStack}
Signature  : ${errorOutput.split('\n')[0].substring(0, 100)}
Status     : Ready for AI Scanner diagnosis & learning.

👉 Open http://localhost:3000 to scan and save this fix to your vault.
======================================================================
`);
        process.exit(0);
      }
    } catch (err) {
      console.error('Failed to parse TraceVault server response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`
❌ TraceVault Server is not reachable at http://localhost:${options.port}.
   Make sure TraceVault is running with:
     npm start (or node server.js)
   Error details: ${err.message}
`);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.error('❌ Connection to TraceVault timed out.');
  process.exit(1);
});

req.write(payload);
req.end();
