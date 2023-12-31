CREATE DATABASE gameServices;

USE gameServices;

CREATE TABLE users (id INT AUTO_INCREMENT, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(50) UNIQUE NOT NULL, passwordhash VARCHAR(60), steam_id VARCHAR(50),PRIMARY KEY(id));
CREATE TABLE games (id INT AUTO_INCREMENT, title VARCHAR(100) UNIQUE, max_players int, price DECIMAL(5, 2), PRIMARY KEY(id));
CREATE TABLE game_profiles (id INT AUTO_INCREMENT, user_id INT, game_id INT, preference TINYINT, score FLOAT, PRIMARY KEY(id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (game_id) REFERENCES games(id)); 
CREATE TABLE genres (id INT AUTO_INCREMENT, name VARCHAR(50) UNIQUE, PRIMARY KEY(id));
CREATE TABLE game_genres (game_id INT, genre_id INT, FOREIGN KEY (genre_id) REFERENCES genres(id), FOREIGN KEY (game_id) REFERENCES games(id));

CREATE USER 'cgard008'@'localhost' IDENTIFIED WITH mysql_native_password BY 'eggg';
GRANT ALL PRIVILEGES ON gameServices.* TO 'cgard008'@'localhost';

