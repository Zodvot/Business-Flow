# Free hosting with Render and Neon

1. Create a separate Neon project for BusinessFlow. Keep its connection string private.
2. In Render, create a Blueprint from this repository. The committed `render.yaml` selects the Free service plan.
3. Set `DATABASE_URL` to the Neon connection string including its SSL settings. For JWT-based apps the blueprint generates a private `JWT_SECRET`.
4. Deploy and verify the public URL. The app creates its PostgreSQL tables at startup.

After signup, promote your first administrator using Neon SQL Editor with `UPDATE users SET role='admin', approved=true WHERE email='YOUR_EMAIL';`. Only promote an account you own. The service initializes its schema and example business records at startup.

## Existing data

This deployment creates a fresh PostgreSQL database. It does not transfer existing MySQL accounts, events, recipes, or local business records. Keep existing databases and backups. A data import needs a separate export and validation step before replacing an existing deployment.

## Local PostgreSQL

Use the standard PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD environment variables, or DATABASE_URL. For the two migrated backends, install dependencies in backend and run `node scripts/init-database.js`, then `npm start`. Set JWT_SECRET before starting. PostgreSQL must already contain the empty target database.

## Free-plan limits

Render free services sleep when idle and share workspace usage limits. Neon has storage and compute limits. Services can wake slowly. Pricing and limits can change.
