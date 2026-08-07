-- Inventário BSOD: produto derivado de docsispolicyname via profiles.txt (botNiveis)
-- Applied by: npm run db:migrate

ALTER TABLE bsod_inventory
  ADD COLUMN produto VARCHAR(255) NOT NULL DEFAULT '' AFTER designacao;
