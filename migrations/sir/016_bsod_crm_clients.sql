-- Catálogo CRM BSOD (portal bsod.nocclaro.com.br) — join por cvlan ↔ bsod_inventory.vlan
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS bsod_crm_clients (
  id INT NOT NULL AUTO_INCREMENT,
  ope VARCHAR(100) NOT NULL,
  uf VARCHAR(8) NOT NULL DEFAULT '',
  svlan VARCHAR(32) NOT NULL DEFAULT '',
  cvlan VARCHAR(32) NOT NULL DEFAULT '',
  cliente VARCHAR(255) NOT NULL DEFAULT '',
  logradouro VARCHAR(255) NOT NULL DEFAULT '',
  numero VARCHAR(64) NOT NULL DEFAULT '',
  complemento VARCHAR(255) NOT NULL DEFAULT '',
  bairro VARCHAR(255) NOT NULL DEFAULT '',
  cep VARCHAR(32) NOT NULL DEFAULT '',
  cidade VARCHAR(255) NOT NULL DEFAULT '',
  produto VARCHAR(255) NOT NULL DEFAULT '',
  designacao VARCHAR(255) NOT NULL DEFAULT '',
  contato_cliente_nome_1 VARCHAR(255) NOT NULL DEFAULT '',
  contato_cliente_telefone_1 VARCHAR(64) NOT NULL DEFAULT '',
  contato_cliente_nome_2 VARCHAR(255) NOT NULL DEFAULT '',
  contato_cliente_telefone_2 VARCHAR(64) NOT NULL DEFAULT '',
  contato_cliente_email_1 VARCHAR(255) NOT NULL DEFAULT '',
  contato_cliente_email_2 VARCHAR(255) NOT NULL DEFAULT '',
  contrato_conectado VARCHAR(64) NOT NULL DEFAULT '',
  construcao_data_execucao VARCHAR(64) NOT NULL DEFAULT '',
  cancelamento_data VARCHAR(64) NOT NULL DEFAULT '',
  cancelamento_motivo VARCHAR(255) NOT NULL DEFAULT '',
  synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bsod_crm_ope_cvlan (ope, cvlan),
  KEY ix_bsod_crm_ope_uf (ope, uf),
  KEY ix_bsod_crm_cvlan (cvlan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
