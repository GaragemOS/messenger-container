-- ==========================================================================
-- 0002_pricing.sql — tabela de tarifas para chargeback por categoria.
-- Valores ILUSTRATIVOS (BR); a Meta atualiza trimestralmente. Nunca fixar
-- preco no codigo — manter aqui e atualizar pela tabela vigente da Meta.
-- ==========================================================================

CREATE TABLE pricing_rates (
  category       text NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication', 'service')),
  country        text NOT NULL DEFAULT 'BR',
  price_usd      numeric(10, 5) NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (category, country, effective_date)
);

INSERT INTO pricing_rates (category, country, price_usd) VALUES
  ('marketing', 'BR', 0.06250),
  ('utility', 'BR', 0.00800),
  ('authentication', 'BR', 0.03150),
  ('service', 'BR', 0.00000)
ON CONFLICT DO NOTHING;
