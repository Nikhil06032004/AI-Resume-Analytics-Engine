# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 5.x (current) | Yes |
| < 5.x | No |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Send details to **dijaasoftware@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 72 hours. If confirmed, a fix will be released and you will be credited in the changelog unless you prefer to remain anonymous.

## Security Practices in This Project

- All secrets (API keys, MongoDB URI) are loaded via environment variables — never hardcoded
- `.env` files are excluded from version control via `.gitignore`
- The backend API rate-limits the `/resume/analyze` endpoint at 10 requests per minute per IP
- CORS is configured to restrict origins in production via `FRONTEND_URL`
- Uploaded files are validated for type (whitelist) and size (10 MB max) before processing
- No user authentication data or passwords are stored — MongoDB only stores resume analysis results
