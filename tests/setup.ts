process.env.AUTH_LOGIN_MAX_REQUESTS = '1000';
process.env.AUTH_SIGNUP_MAX_REQUESTS = '1000';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-para-ci-misionero-2026-al-menos-32-caracteres';
}
