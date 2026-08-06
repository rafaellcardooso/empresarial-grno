-- BSOD / PME inventory + RF monitor (escrito por workers/bsod)
-- Applied by: npm run db:migrate

CREATE TABLE IF NOT EXISTS bsod_cables (
  id INT NOT NULL AUTO_INCREMENT,
  ope VARCHAR(100) NOT NULL,
  ddd VARCHAR(10) NOT NULL DEFAULT '',
  hostname_cmts VARCHAR(100) NOT NULL DEFAULT '',
  node VARCHAR(100) NOT NULL DEFAULT '',
  id_cable VARCHAR(100) NOT NULL DEFAULT '',
  mac VARCHAR(100) NOT NULL,
  ip_ger VARCHAR(100) NOT NULL DEFAULT '',
  vendor VARCHAR(100) NOT NULL DEFAULT '',
  model VARCHAR(100) NOT NULL DEFAULT '',
  hw_ver VARCHAR(100) NOT NULL DEFAULT '',
  sw_ver VARCHAR(100) NOT NULL DEFAULT '',
  docsis_ver VARCHAR(100) NOT NULL DEFAULT '',
  d31_capable VARCHAR(100) NOT NULL DEFAULT '',
  ds_count VARCHAR(100) NOT NULL DEFAULT '',
  us_count VARCHAR(100) NOT NULL DEFAULT '',
  longitude VARCHAR(100) NOT NULL DEFAULT '',
  latitude VARCHAR(100) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  reg_status VARCHAR(100) NOT NULL DEFAULT '',
  last_update VARCHAR(100) NOT NULL DEFAULT '',
  chronic_days VARCHAR(100) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bsod_cables_ope_mac (ope, mac),
  KEY ix_bsod_cables_cmts_node (hostname_cmts, node),
  KEY ix_bsod_cables_ddd (ddd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS bsod_inventory (
  id INT NOT NULL AUTO_INCREMENT,
  ope VARCHAR(100) NOT NULL,
  ddd VARCHAR(10) NOT NULL DEFAULT '',
  cmts VARCHAR(100) NOT NULL DEFAULT '',
  mac VARCHAR(100) NOT NULL,
  id_cable VARCHAR(100) NOT NULL DEFAULT '',
  node VARCHAR(100) NOT NULL DEFAULT '',
  contrato VARCHAR(100) NOT NULL DEFAULT '',
  profile VARCHAR(100) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  bsod_vlan INT NOT NULL DEFAULT 0,
  vlan VARCHAR(10) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bsod_inventory_ope_mac (ope, mac),
  KEY ix_bsod_inventory_cmts_node (cmts, node),
  KEY ix_bsod_inventory_ddd (ddd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS bsod_monitor (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ope VARCHAR(100) NOT NULL,
  ddd VARCHAR(10) NOT NULL DEFAULT '',
  mac VARCHAR(100) NOT NULL,
  status INT NOT NULL DEFAULT 0,
  tx DOUBLE NOT NULL DEFAULT 0,
  rx DOUBLE NOT NULL DEFAULT 0,
  mer DOUBLE NOT NULL DEFAULT 0,
  sampled_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY ix_bsod_monitor_mac (mac),
  KEY ix_bsod_monitor_ope (ope),
  KEY ix_bsod_monitor_sampled_at (sampled_at),
  KEY ix_bsod_monitor_ope_mac_time (ope, mac, sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
