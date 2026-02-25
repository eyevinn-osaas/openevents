-- Fix orders that went through invoice payment flow but were never updated to PENDING_INVOICE status.
-- These orders have status = 'PENDING' and paymentMethod = 'INVOICE', meaning the user chose invoice
-- payment but the status was not correctly transitioned. Update them to PENDING_INVOICE and clear
-- the expiry timer (invoice orders do not expire).
UPDATE "orders"
SET
  status     = 'PENDING_INVOICE',
  "expiresAt" = NULL
WHERE
  status          = 'PENDING'
  AND "paymentMethod" = 'INVOICE'
  AND "paidAt"    IS NULL
  AND "cancelledAt" IS NULL;
