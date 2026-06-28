-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE payment_providers ADD COLUMN test_credentials TEXT;
ALTER TABLE payment_providers ADD COLUMN notes TEXT;

-- Seed default test credentials and notes for existing providers
UPDATE payment_providers SET 
    test_credentials = '{"card_number": "5078 5078 5078 5078", "cvv": "081", "pin": "1111", "otp": "123456", "bank_accounts": [{"bank": "Access Bank", "number": "0690000031", "otp": "12345"}]}',
    notes = 'Standard Paystack sandbox cards and bank transfer rules apply.'
WHERE name = 'paystack';

UPDATE payment_providers SET 
    test_credentials = '{"card_number": "5531 8866 5214 2950", "cvv": "564", "pin": "3310", "otp": "12345"}',
    notes = 'Flutterwave sandbox cards and PIN/OTP flows apply.'
WHERE name = 'flutterwave';

UPDATE payment_providers SET 
    test_credentials = '{"card_number": "5061 4604 1012 1111 104", "cvv": "560", "pin": "1104", "otp": "543210", "wallets": [{"phone": "01066668888", "outcome": "SUCCESS"}, {"phone": "01077779999", "outcome": "FAILED"}]}',
    notes = 'OPay Sandbox Webhooks for SUCCESS require returning to the merchant checkouts. Card PIN and wallet tests are active.'
WHERE name = 'opay';

UPDATE payment_providers SET 
    test_credentials = '{"card_number": "5434 6210 7425 2808", "pin": "9999", "otp": "9999"}',
    notes = 'Nomba Sandbox is currently deactivated. Default credentials require PIN 9999 and OTP 9999.'
WHERE name = 'nomba';

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
-- SQLite doesn't support DROP COLUMN directly in older versions, but we can do it if needed.
-- However, standard drop is supported in modern sqlite.
ALTER TABLE payment_providers DROP COLUMN test_credentials;
ALTER TABLE payment_providers DROP COLUMN notes;
