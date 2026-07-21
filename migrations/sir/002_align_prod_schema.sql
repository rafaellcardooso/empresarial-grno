-- Upgrade schema created by early 001 (num_recup PK) to production layout.
-- Safe to skip when tables were created from current 001 or restored via db:import.

ALTER TABLE rals
  DROP PRIMARY KEY,
  ADD COLUMN id INT NOT NULL AUTO_INCREMENT FIRST,
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY unique_num_recup (num_recup);

ALTER TABLE rals DROP CHECK chk_rals_status;
ALTER TABLE recs DROP CHECK chk_recs_status;

ALTER TABLE recs MODIFY COLUMN status VARCHAR(20) DEFAULT 'ATIVO';
