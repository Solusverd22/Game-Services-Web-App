SELECT games.title, games.max_players FROM games
WHERE NOT EXISTS (
  SELECT 1 FROM game_profiles
  INNER JOIN users ON game_profiles.user_id = users.id
  WHERE users.username = 'Conor' AND game_profiles.game_id = games.id
);