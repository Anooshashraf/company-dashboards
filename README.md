This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local development: Google Sheets troubleshooting

To avoid local OpenSSL "DECODER routines::unsupported" errors caused by newline / quoting differences across environments, the API supports two ways to provide the service account private key:

- `GOOGLE_PRIVATE_KEY` (raw PEM with escaped newlines) — Example:

	```env
	GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
	```

- `GOOGLE_PRIVATE_KEY_BASE64` (recommended) — base64-encode the full PEM key and set this env var. The server decodes it, avoiding newline issues in `.env` files.

If you hit decoding or auth errors, use `http://localhost:3000/api/debug` to get diagnostics (it will show whether the email, key, and sheet ID are present). Server logs and `/api/debug` also return clearer messages for invalid key formats and auth failures.
