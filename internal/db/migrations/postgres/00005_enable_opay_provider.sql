-- +goose Up
-- SQL in this section is executed when the migration is applied.
UPDATE payment_providers SET is_supported = TRUE, description = 'Leading mobile wallet and payment services provider in Nigeria.' WHERE name = 'opay';

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
UPDATE payment_providers SET is_supported = FALSE, description = 'Leading mobile wallet and payment services provider in Nigeria (Coming Soon).' WHERE name = 'opay';
