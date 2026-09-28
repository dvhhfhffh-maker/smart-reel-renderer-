# D1 database setup

This folder contains the Cloudflare D1 schema for the commercial Telegram bot.

## Database name

`smart-assistant-db`

## Binding name

`DB`

## Apply the migration

After the D1 database is created in Cloudflare and bound to the Worker as `DB`, apply:

```bash
npx wrangler d1 execute smart-assistant-db --remote --file=database/0001_init.sql
```

## Tables

- `users`: Telegram users and account state
- `wallets`: current credit balance
- `credit_ledger`: immutable credit movements
- `orders`: image/Reel/video jobs
- `payments`: Telegram Stars and future payment records
- `subscriptions`: paid plan periods

Never commit API keys, Telegram bot tokens, Cloudflare tokens, or payment secrets to GitHub.
