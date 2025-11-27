-- Table principale des films
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    allocine_id BIGINT UNIQUE,
    tmdb_id BIGINT UNIQUE,
    title TEXT NOT NULL,
    original_title TEXT NOT NULL,
    is_adult BOOLEAN,
    original_language VARCHAR(10),
    overview TEXT,
    en_overview TEXT,
    popularity REAL,
    poster_path TEXT,
    release_date DATE,
    revenue BIGINT,
    budget BIGINT,
    runtime INTEGER,
    vote_average REAL,
    vote_count INTEGER,
    spoken_languages TEXT[]                       -- Tableau de langues (ex: ['en', 'fr'])
);

-- Table des genres
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,          -- ID auto-incrémenté
    genre TEXT UNIQUE NOT NULL      -- Nom du genre, unique
);

-- Association entre films et genres
CREATE TABLE movie_genre (
    movie_id INTEGER,
    genre_id INTEGER,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);

-- Table des mots-clés
CREATE TABLE keywords (
    id INTEGER PRIMARY KEY,
    keyword TEXT NOT NULL
);

-- Association entre films et mots-clés
CREATE TABLE movie_keyword (
    movie_id INTEGER,
    keyword_id INTEGER,
    PRIMARY KEY (movie_id, keyword_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (keyword_id) REFERENCES keywords(id)
);

-- Table des sociétés de production
CREATE TABLE production_company (
    id INTEGER PRIMARY KEY,
    logo TEXT,
    production_company TEXT NOT NULL
);

-- Association entre films et sociétés de production
CREATE TABLE movie_production_company (
    movie_id INTEGER,
    company_id INTEGER,
    PRIMARY KEY (movie_id, company_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (company_id) REFERENCES production_company(id)
);

-- Table des personnes (acteur, réalisateur, etc.)
CREATE TABLE peoples (
    id SERIAL PRIMARY KEY,
    allocine_id BIGINT UNIQUE,
    tmdb_id BIGINT UNIQUE,
    name TEXT NOT NULL,
    profile_path TEXT
);

-- Table de liaison entre personnes et films avec rôle
CREATE TABLE movie_people (
    movie_id INTEGER,
    person_id INTEGER,
    role_type TEXT CHECK (role_type IN ('actor', 'director')),  -- acteur ou réalisateur
    character TEXT,                          -- nom du personnage (si acteur), NULL si réalisateur
    PRIMARY KEY (movie_id, person_id, role_type),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (person_id) REFERENCES peoples(id)
);

--________________________________________________________________
--________________________________________________________________

CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,                       -- ID interne unique
    name TEXT NOT NULL,                          -- Nom du cinéma
    address TEXT NOT NULL,                       -- Adresse postale complète
    image TEXT,                                  -- URL ou chemin de l’image
    wherefind VARCHAR(20),              -- Origine des données ('allocine', etc.)
    idallocine VARCHAR(20)                       -- Identifiant AlloCiné (peut être NULL)
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,                       -- Internal session ID
    allocine_id BIGINT UNIQUE,                   -- Optional AlloCiné session ID
    movie_id INTEGER NOT NULL,                   -- Reference to the movie
    cinema_id INTEGER NOT NULL,                  -- Reference to the cinema
    startsAt TIMESTAMP NOT NULL,
    projection VARCHAR(50),                      -- Format (e.g. DIGITAL, IMAX, 3D)
    version VARCHAR(50),                         -- Version info (e.g. ORIGINAL, EXTENDED VERSION)
    booking_url TEXT,                            -- URL to buy tickets

    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
);

-------- VIDAGE 
TRUNCATE TABLE 
    movie_people,
    movie_keyword,
    movie_genre,
    movie_production_company,
    sessions,
    keywords,
    genres,
    production_company,
    peoples,
    movies
RESTART IDENTITY CASCADE;

---------- DELETE
DROP TABLE IF EXISTS
    movie_people,
    movie_keyword,
    movie_genre,
    movie_production_company,
    sessions,
    keywords,
    genres,
    production_company,
    peoples,
    movies,
    cinemas
CASCADE;


-- INSERT
INSERT INTO cinemas(name, address, image, wherefind, idallocine)
VALUES
('Jeu de Paume', '1 Pl. de la Concorde 75001 Paris', NULL, 'allocine', 'W7588'),
-- ('UGC Ciné Cité Les Halles', '7 Place de la Rotonde 75001 Paris', NULL, 'allocine', 'C0159'),
('Grand Rex', '1 Bd Poissonnière, 75002 Paris', NULL, 'allocine', 'C0065'),
('Pathé BNP Paribas', 'Opéra Premier, 32 Rue Louis le Grand, 75002 Paris', NULL, 'allocine', 'C0060'),
('MK2 Beaubourg', '50 Rue Rambuteau, 75003 Paris', NULL, 'allocine', 'C0050'),
('Luminor Hôtel de Ville', '20 Rue du Temple, 75004 Paris', NULL, 'allocine', 'C0013'),
('Cinéma du Panthéon', '13 Rue Victor Cousin, 75005 Paris', NULL, 'allocine', 'C0076'),
('Écoles Cinéma Club', '23 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0071'),
('Espace Saint-Michel', '7 Pl. Saint-Michel, 75005 Paris', NULL, 'allocine', 'C0117'),
('Le Grand Action', '5 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0072'),
('La Filmothèque du Quartier latin', '9 Rue Champollion, 75005 Paris', NULL, 'allocine', 'C0020'),
('Le Champo', '51 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0073'),
('L''Épée de bois', '100 Rue Mouffetard, 75005 Paris', NULL, 'allocine', 'W7504'),
('Reflet Médicis', '3 Rue Champollion, 75005 Paris', NULL, 'allocine', 'C0074'),
('Studio des Ursulines', '10 Rue des Ursulines, 75005 Paris', NULL, 'allocine', 'C0083'),
('Studio Galande', '42 Rue Galande, 75005 Paris', NULL, 'allocine', 'C0016'),
('Christine Cinéma Club', '4 Rue Christine, 75006 Paris', NULL, 'allocine', 'C0015'),
('L''Arlequin', '76 Rue de Rennes, 75006 Paris', NULL, 'allocine', 'C0054'),
('Les 3 Luxembourg', '67 Rue Monsieur le Prince, 75006 Paris', NULL, 'allocine', 'C0095'),
('Lucernaire', '53 Rue Notre Dame des Champs, 75006 Paris', NULL, 'allocine', 'C0093'),
('MK2 Odéon (côté Saint-Germain)', '113, bd Saint-Germain 75006 Paris', NULL, 'allocine', 'C0097'),
('MK2 Odéon (côté Saint-Michel)', '7, rue Hautefeuille, 75006 Paris', NULL, 'allocine', 'C0092'),
('MK2 Parnasse', '11 rue Jules Chaplain, 75006 Paris', NULL, 'allocine', 'C0099'),
('Nouvel Odéon', '6 rue de l''Ecole-de-Medecine, 75006 Paris', NULL, 'allocine', 'C0041'),
('Saint-André des Arts', '30 Rue Saint-André des Arts, 75006 Paris', NULL, 'allocine', 'C0100'),
('Le Saint-Germain-des-Prés', '22 Rue Guillaume Apollinaire, 75006 Paris', NULL, 'allocine', 'C0096'),
('UGC Danton', '99 Bd Saint-Germain, 75006 Paris', NULL, 'allocine', 'C0102'),
('UGC Montparnasse', '83 Bd du Montparnasse, 75006 Paris', NULL, 'allocine', 'C0103'),
('UGC Odéon', '124 Bd Saint-Germain, 75006 Paris', NULL, 'allocine', 'C0104'),
('UGC Rotonde', '103 Bd du Montparnasse, 75006 Paris', NULL, 'allocine', 'C0105'),
('Cinéma Katara', '37 avenue Hoche, 75008 Paris', NULL, NULL, NULL),
('Élysées Biarritz', '22-24 Rue Quentin Bauchart, 75008 Paris', NULL, NULL, NULL),
('Élysées Lincoln', '14 Rue Lincoln, 75008 Paris', NULL, 'allocine', 'C0108'),
('Le Balzac', '1 Rue Balzac, 75008 Paris', NULL, 'allocine', 'C0009'),
('Publicis Cinémas', '129 Av. des Champs-Élysées, 75008 Paris', NULL, 'allocine', 'C6336'),
('Les 5 Caumartin', '101 Rue Saint-Lazare, 75009 Paris', NULL, 'allocine', 'C0012'),
('Max-Linder Panorama', '24 Bd Poissonnière, 75009 Paris', NULL, 'allocine', 'C0089'),
('Pathé Palace', '2 Bd des Capucines, 75009 Paris', NULL, 'allocine', 'G02BG'),
('UGC Opéra', '32 Bd des Italiens, 75009 Paris', NULL, 'allocine', 'C0126'),
('L''Archipel', '17 Bd de Strasbourg, 75010 Paris', NULL, 'allocine', 'C0134'),
('Le Brady', '39 Bd de Strasbourg, 75010 Paris', NULL, 'allocine', 'C0023'),
('Le Louxor', '170 Bd de Magenta, 75010 Paris', NULL, 'allocine', 'W7510'),
('Majestic Bastille', '4 Bd Richard-Lenoir, 75011 Paris', NULL, 'allocine', 'C0139'),
('MK2 Bastille (côté Beaumarchais)', '4 Bd Beaumarchais, 75011 Paris', NULL, 'allocine', 'C0140'),
('MK2 Bastille (côté Faubourg Saint-Antoine)', '5 rue du Faubourg-Saint-Antoine, 75011 Paris', NULL, 'allocine', 'C0040'),
('MK2 Nation', '133 bd Diderot, 75012 Paris', NULL, 'allocine', 'C0144'),
('UGC Ciné Cité Bercy', '2 Cr Saint-Emilion, 75012 Paris', NULL, 'allocine', 'C0026'),
('UGC Lyon Bastille', '12 Rue de Lyon, 75012 Paris', NULL, 'allocine', 'C0146'),
('L''Escurial', '11 Bd de Port-Royal, 75013 Paris', NULL, 'allocine', 'C0147'),
('MK2 Bibliothèque', '128-162 avenue de France, 75013 Paris', NULL, 'allocine', 'C2954'),
('MK2 Bibliothèque x Centre Pompidou', '128-162 Av. de France accès en face de l’entrée principale de la Bibliothèque Nationale Francois Mitterrand, 75013 Paris', NULL, 'allocine', 'C0127'),
('Pathé Les Fauvettes', '58 Av. des Gobelins, 75013 Paris', NULL, 'allocine', 'C0024'),
('UGC Gobelins', '66 bis Av. des Gobelins, 75013 Paris', NULL, 'allocine', 'C0150'),
('7 Parnassiens', '98 Boulevard du Montparnasse, 75014 Paris', NULL, 'allocine', 'C0025'),
('Chaplin Denfert', '24 Place Denfert-Rochereau, 75014 Paris', NULL, 'allocine', 'C0153'),
('L''Entrepôt', '7 Rue Francis de Pressensé, 75014 Paris', NULL, 'allocine', 'C0005'),
('Pathé Alésia', '73 Avenue  du Général Leclerc, 75014 Paris', NULL, 'allocine', 'C0037'),
('Pathé Montparnos', '16 Rue d''Odessa, 75014 Paris', NULL, 'allocine', 'C0052'),
('Pathé Parnasse', '3 Rue d''Odessa, 75014 Paris', NULL, 'allocine', 'C0158'),
('Chaplin Saint-Lambert', '6 Rue Péclet, 75015 Paris', NULL, 'allocine', 'W7515'),
('Pathé Aquaboulevard', '16 Rue du Colonel Pierre Avia, 75015 Paris', NULL, 'allocine', 'C0116'),
('Pathé Beaugrenelle', '7 Rue Linois 75015 Paris', NULL, 'allocine', 'W7502'),
('Pathé Convention', '27 Rue Alain Chartier, 75015 Paris', NULL, 'allocine', 'C0161'),
('Majestic Passy', '18 Rue de Passy, 75016 Paris', NULL, 'allocine', 'C0120'),
('7 Batignolles', '86 Rue Mstislav Rostropovitch, 75017 Paris', NULL, 'allocine', 'P7517'),
('Cinéma des Cinéastes', '7 Avenue de Clichy, 75017 Paris', NULL, 'allocine', 'C0004'),
('Club de l''Étoile', '14 Rue Troyon, 75017 Paris', NULL, 'allocine', 'W7517'),
('Mac-Mahon', '5 Avenue Mac-Mahon, 75017 Paris', NULL, 'allocine', 'C0172'),
('UGC Ciné Cité Maillot', '2 Pl de la Pte Maillot, 75017 Paris', NULL, 'allocine', 'C0175'),
('Pathé Wepler', 'Côté Place, 140 Bd de Clichy, 75018 Paris', NULL, 'allocine', 'C0179'),
('Studio 28', '10 Rue Tholozé, 75018 Paris', NULL, 'allocine', 'C0061'),
('MK2 Quai de Loire', '7 Quai de la Loire, 75019 Paris', NULL, 'allocine', 'C1621'),
('MK2 Quai de Seine', '14 Quai de la Seine, 75019 Paris', NULL, 'allocine', 'C0003'),
('La Géode - IMAX', '26 Avenue Corentin-Cariou, 75019 Paris', NULL, 'allocine', 'C0189'),
('Pathé La Villette', '30 Avenue. Corentin Cariou, 75019 Paris', NULL, 'allocine', 'W7520'),
('UGC Ciné Cité Paris 19', '166 Bd Macdonald, 75019 Paris', NULL, 'allocine', 'W7509'),
('CGR Paris - Lilas', 'Place du Maquis du Vercors, 75020 Paris', NULL, 'allocine', 'W7519'),
('MK2 Gambetta', '6 Rue Belgrand, 75020 Paris', NULL, 'allocine', 'C0192');