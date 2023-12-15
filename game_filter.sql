SELECT games.*
FROM games
INNER JOIN game_profiles ON games.id = game_profiles.game_id
INNER JOIN users ON game_profiles.user_id = users.id
-- 1 and 4 are stand in ids, populated from id array in the app
WHERE users.id IN (1, 4) 
GROUP BY games.id
-- 2 is the length of the id array
HAVING COUNT(DISTINCT users.id) = 2;
