# BusinessFlow

A local, single-workspace React + Express + PostgreSQL business app.
Approved members share customer, product and invoice records. Personal profiles
and admin controls are separate. All currency is USD.

## Run on Windows

In PowerShell from this folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-BusinessFlow.ps1
```

Enter the PostgreSQL installation password privately. Open
http://127.0.0.1:3001 when the terminal says ready. Keep the terminal running.
Stop an older backend with Ctrl+C first if port 3001 is occupied.
This command builds the frontend and serves everything through Express.
Passwords are held in the terminal environment for the running session.

## First installation

Install Node.js and PostgreSQL, create a database named businessflow, and run
`npm.cmd ci` in Frontend and Backend. Set PGUSER, PGHOST, PGPORT and PGDATABASE
if your PostgreSQL settings differ from postgres, 127.0.0.1, 5432 and businessflow.
Set PGPASSWORD privately in the terminal, then run `node setup.js` in Backend.
Setup seeds four example invoices once; existing rows are preserved.
Server startup applies additive schema changes automatically.

Sign up in the browser. In an authenticated Backend terminal, run
`node admin.js your-email@example.com` to promote the first admin.
Refresh the browser. Administrators can approve members, promote admins,
and revoke member workspace access through My profile.

## Workflows

- Customers: add and rename; administrators may delete customers without invoices.
- Products: add and edit names and prices.
- On the first upgrade, the product catalog is populated from existing invoice
  descriptions, using each description's highest saved invoice amount as its
  initial price. Review these prices before creating new invoices.
- Invoices: create from a customer and product, change status, search.
- Invoice creation snapshots the product name and price. Later catalog edits
  preserve existing invoices. Duplicate retries use a request ID.
- Dashboard, Home, Reports and Assistant read PostgreSQL-backed records.
- Monthly totals group by invoice issue month using the Beirut calendar.
  Paid totals describe the current status of those invoices, not payment-date cash flow.
- Reports exports all invoices; Dashboard exports the selected month.
- Profile: picture, birthday, gender, account age, password change and sign out.
- Settings: workspace label is a local browser preference.
- Reopen pages or refresh to see external pgAdmin edits.

## Scope

This is a local learning/portfolio app. Assistant uses preset calculations.
Payments are recorded manually. Email verification, email password recovery,
external AI, automated payment processing, multi-company isolation and public
hosting are outside this release. Public deployment requires HTTPS and further
operational/security work. Production cookies require HTTPS.

## Back up your data

In pgAdmin, right-click businessflow and choose Backup, then select Custom format
and a safe file location. Restore into a separate database to verify a backup.
Keep backups outside this source folder.

## Developer checks

Frontend: `npm.cmd run build`.
Backend integration suite: `node integration.test.js`, with TEST_API_URL and
TEST_DATABASE=1 set and PG connection variables pointing to a disposable test
database. The suite inserts test accounts and records; never point it at live data.

Main implementation entry points are Frontend/main.tsx, Backend/index.js,
Backend/business.js and Backend/accounts.js.
