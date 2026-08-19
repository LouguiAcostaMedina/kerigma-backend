#!/usr/bin/env node
/**
 * Smoke Test — SGM Backend
 *
 * Verifica que cada endpoint principal devuelve una respuesta válida (no 500).
 * Ejecuta login real, luego un GET a cada feature principal.
 *
 * Uso:
 *   node scripts/smoke-test.js                    # localhost:5000
 *   BASE_URL=http://localhost:5000 node scripts/smoke-test.js
 *   SMOKE_USER=admin@misionero.com SMOKE_PASS=AdminMisionero2024! node scripts/smoke-test.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const EMAIL = process.env.SMOKE_USER || 'admin@misionero.com';
const PASSWORD = process.env.SMOKE_PASS || 'AdminMisionero2024!';

const ENDPOINTS = [
  { name: 'Health check', method: 'GET', path: '/health', auth: false },
  { name: 'Auth me', method: 'GET', path: '/api/v1/auth/me', auth: true },
  { name: 'Dashboard', method: 'GET', path: '/api/v1/dashboard/stats', auth: true },
  { name: 'Members', method: 'GET', path: '/api/v1/members', auth: true },
  { name: 'Groups', method: 'GET', path: '/api/v1/groups', auth: true },
  { name: 'Students', method: 'GET', path: '/api/v1/students', auth: true },
  { name: 'Churches', method: 'GET', path: '/api/v1/churches', auth: true },
  { name: 'Activities', method: 'GET', path: '/api/v1/activities', auth: true },
  { name: 'Financial contributions', method: 'GET', path: '/api/v1/financial-contributions', auth: true },
  { name: 'Notifications', method: 'GET', path: '/api/v1/notifications', auth: true },
  { name: 'Audit logs', method: 'GET', path: '/api/v1/audit-logs', auth: true },
  { name: 'Hierarchy', method: 'GET', path: '/api/v1/hierarchy/associations', auth: true },
  { name: 'Ministries', method: 'GET', path: '/api/v1/ministries', auth: true },
  { name: 'Pastoral care', method: 'GET', path: '/api/v1/pastoral-care/prayer-requests', auth: true },
  { name: 'Documents', method: 'GET', path: '/api/v1/documents', auth: true },
  { name: 'Baptism pipeline', method: 'GET', path: '/api/v1/baptism-pipeline/metrics', auth: true },
  { name: 'Feature flags', method: 'GET', path: '/api/v1/feature-flags', auth: true },
  { name: 'Clients', method: 'GET', path: '/api/v1/clients', auth: true },
  { name: 'Payments', method: 'GET', path: '/api/v1/payments', auth: true },
  { name: 'Catalog', method: 'GET', path: '/api/v1/catalog', auth: true },
  { name: 'Users', method: 'GET', path: '/api/v1/users', auth: true },
  { name: 'Reports', method: 'GET', path: '/api/v1/reports/stats', auth: true },
  { name: 'Data protection', method: 'GET', path: '/api/v1/data-protection/nonexistent/consent', auth: true },
];

async function login() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${res.statusText}`);
  }
  const setCookie = res.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
  if (!tokenMatch) {
    throw new Error('No accessToken cookie in login response');
  }
  return tokenMatch[1];
}

async function checkEndpoint(token, endpoint) {
  const headers = {};
  if (endpoint.auth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, { method: endpoint.method, headers });
    const status = res.status;
    const is500 = status >= 500;
    return { name: endpoint.name, path: endpoint.path, status, ok: !is500 };
  } catch (err) {
    return { name: endpoint.name, path: endpoint.path, status: 'ERR', ok: false, error: err.message };
  }
}

async function main() {
  console.log(`\n=== SGM Smoke Test ===`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User: ${EMAIL}\n`);

  let token;
  try {
    token = await login();
    console.log('Login: OK (token obtained)\n');
  } catch (err) {
    console.error(`Login: FAIL — ${err.message}`);
    console.error('Cannot proceed without authentication. Aborting.\n');
    process.exit(1);
  }

  const results = [];
  for (const ep of ENDPOINTS) {
    const result = await checkEndpoint(token, ep);
    const icon = result.ok ? '  OK' : 'FAIL';
    const extra = result.error ? ` (${result.error})` : '';
    console.log(`[${icon}] ${result.status.toString().padEnd(4)} ${result.name.padEnd(30)} ${result.path}${extra}`);
    results.push(result);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Results: ${results.length} endpoints, ${results.length - failed.length} OK, ${failed.length} FAIL ===\n`);

  if (failed.length > 0) {
    console.error('Failed endpoints:');
    failed.forEach((f) => console.error(`  - ${f.name} (${f.path}): ${f.status}`));
    process.exit(1);
  }

  console.log('All endpoints responded without 500 errors.\n');
  process.exit(0);
}

main();
