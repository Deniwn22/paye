-- +goose Up
-- SQL in this section is executed when the migration is applied.
UPDATE payment_providers SET is_supported = FALSE, description = 'Simplified business payments (Coming Soon).' WHERE name = 'nomba';

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
UPDATE payment_providers SET is_supported = TRUE, description = 'Simplified business payments.' WHERE name = 'nomba';
