-- ==========================================================================
-- 0003_messages_cascade.sql — torna a exclusao consistente.
-- messages referenciava products/client_companies/phone_numbers sem ON DELETE
-- CASCADE, bloqueando a exclusao do tenant. Alinha com o restante do schema.
-- ==========================================================================

ALTER TABLE messages
  DROP CONSTRAINT messages_product_id_fkey,
  ADD CONSTRAINT messages_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE messages
  DROP CONSTRAINT messages_client_company_id_fkey,
  ADD CONSTRAINT messages_client_company_id_fkey
    FOREIGN KEY (client_company_id) REFERENCES client_companies(id) ON DELETE CASCADE;

ALTER TABLE messages
  DROP CONSTRAINT messages_phone_number_id_fkey,
  ADD CONSTRAINT messages_phone_number_id_fkey
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE;
