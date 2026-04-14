CREATE DATABASE IF NOT EXISTS game_theory;
USE game_theory;

CREATE TABLE IF NOT EXISTS strategies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  is_nice BOOLEAN NOT NULL,
  is_forgiving BOOLEAN NOT NULL,
  is_retaliating BOOLEAN NOT NULL,
  is_clear BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(120) NOT NULL,
  strategy_id INT NOT NULL,
  total_rounds INT NOT NULL,
  player_score INT NOT NULL,
  agent_score INT NOT NULL,
  noise_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  result ENUM('win','lose','draw') NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id)
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  round_num INT NOT NULL,
  player_action ENUM('cooperate','defect') NOT NULL,
  agent_action ENUM('cooperate','defect') NOT NULL,
  player_payoff INT NOT NULL,
  agent_payoff INT NOT NULL,
  noise_applied BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  strategy_id INT NOT NULL,
  total_score INT NOT NULL,
  avg_score_per_round DECIMAL(8,2) NOT NULL,
  rank_position INT NOT NULL,
  simulated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id)
);

INSERT INTO strategies (name, slug, description, is_nice, is_forgiving, is_retaliating, is_clear)
VALUES
  ('Tit for Tat', 'tit_for_tat', 'Empieza cooperando y luego copia la ultima accion del oponente.', TRUE, TRUE, TRUE, TRUE),
  ('Grim Trigger', 'grim', 'Coopera hasta la primera traicion del rival; despues traiciona siempre.', TRUE, FALSE, TRUE, TRUE),
  ('Joss', 'joss', 'Tit for Tat con una pequena probabilidad de traicionar de forma oportunista.', TRUE, TRUE, TRUE, FALSE),
  ('Random', 'random', 'Elige cooperar o traicionar al azar en cada ronda.', FALSE, FALSE, FALSE, FALSE),
  ('Tit for Two Tats', 'tit_for_two_tats', 'Solo castiga cuando detecta dos traiciones consecutivas del rival.', TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
