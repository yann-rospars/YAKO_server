---------------------------------------
-- TYPES ENUM
---------------------------------------

DO $$ BEGIN
    CREATE TYPE movie_role_type AS ENUM ('actor', 'director');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE list_type AS ENUM ('system', 'custom');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

---------------------------------------
-- TABLE POUR LES FILMS
---------------------------------------

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    allocine_id BIGINT UNIQUE,
    tmdb_id BIGINT UNIQUE,
    title TEXT NOT NULL,
    original_title TEXT NOT NULL,
    is_adult BOOLEAN DEFAULT FALSE,
    original_language VARCHAR(10),
    overview TEXT,
    en_overview TEXT,
    popularity REAL DEFAULT 0 NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date DATE,
    revenue BIGINT,
    budget BIGINT,
    runtime INTEGER,
    vote_average REAL,
    vote_count INTEGER,
    spoken_languages TEXT[],
    valid_mapping BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    genre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_genre (
    movie_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS movie_keyword (
    movie_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    PRIMARY KEY (movie_id, keyword_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS production_company (
    id INTEGER PRIMARY KEY,
    logo TEXT,
    production_company TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_production_company (
    movie_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    PRIMARY KEY (movie_id, company_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES production_company(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS peoples (
    id SERIAL PRIMARY KEY,
    allocine_id BIGINT UNIQUE,
    tmdb_id BIGINT UNIQUE,
    name TEXT NOT NULL,
    profile_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_people (
    movie_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    role_type movie_role_type NOT NULL,
    character TEXT,
    "order" INTEGER,
    PRIMARY KEY (movie_id, person_id, role_type),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES peoples(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movie_trailers (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    youtube_key TEXT NOT NULL UNIQUE,
    trailer_type TEXT NOT NULL,
    language VARCHAR(10),
    region VARCHAR(5),
    official BOOLEAN DEFAULT FALSE,
    size INTEGER,
    published_at TIMESTAMP,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------
-- TABLE POUR LES CINÉMAS / SÉANCES
---------------------------------------

CREATE TABLE IF NOT EXISTS cinemas (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    image TEXT,
    wherefind VARCHAR(20),
    idallocine VARCHAR(20) UNIQUE,
    city TEXT,
    postal_code VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    allocine_id BIGINT UNIQUE,
    movie_id INTEGER NOT NULL,
    cinema_id INTEGER NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    projection VARCHAR(50),
    version VARCHAR(50),
    booking_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

---------------------------------------
-- TABLE POUR LES UTILISATEURS
---------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_color TEXT DEFAULT '#FF6B35',
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_km INTEGER DEFAULT 10,
    notifications_enabled BOOLEAN DEFAULT FALSE,
    email_notifications_enabled BOOLEAN DEFAULT FALSE,
    push_notifications_enabled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,

    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status friendship_status NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_not_self CHECK (user1_id <> user2_id),

    CONSTRAINT check_requested_by
    CHECK (requested_by = user1_id OR requested_by = user2_id)
);

CREATE UNIQUE INDEX unique_friendship_pair
ON friendships (
    LEAST(user1_id, user2_id),
    GREATEST(user1_id, user2_id)
);

---------------------------------------
-- LISTES DE FILMS
---------------------------------------

CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    type list_type NOT NULL DEFAULT 'custom',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_default_list_per_user UNIQUE (user_id, name)
);

---------------------------------------
-- FILMS DANS LES LISTES
---------------------------------------

CREATE TABLE IF NOT EXISTS list_movies (
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    note TEXT,
    PRIMARY KEY (list_id, movie_id)
);

---------------------------------------
-- NOTES / AVIS UTILISATEURS
---------------------------------------

CREATE TABLE IF NOT EXISTS user_ratings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating NUMERIC(3,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    review TEXT,
    contains_spoiler BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

---------------------------------------
-- APPAREILS UTILISATEUR (NOTIFICATIONS PUSH)
---------------------------------------

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token TEXT UNIQUE NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    device_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

---------------------------------------
-- ÉVÉNEMENTS DE NOTIFICATION
---------------------------------------

CREATE TABLE IF NOT EXISTS notification_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    cinema_id INTEGER REFERENCES cinemas(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    list_id INTEGER REFERENCES lists(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    title TEXT,
    body TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

---------------------------------------
-- AUTHENTIFICATION EXTERNE / PROVIDERS
---------------------------------------

CREATE TABLE IF NOT EXISTS user_auth_providers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'email')),
    provider_user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, provider),
    UNIQUE (provider, provider_user_id)
);

---------------------------------------
-- Fonction User 
---------------------------------------

-- créer automatiquement une ligne dans public.users dès qu'un utilisateur s'inscrit via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (NEW.id, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- vérifier si un email existe déjà dans auth.users depuis l'app React Native.
CREATE OR REPLACE FUNCTION email_exists(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crée la liste par défaut quand un user est inséré dans public.users
CREATE OR REPLACE FUNCTION public.create_default_list()
RETURNS trigger AS $$
BEGIN
  INSERT INTO lists (user_id, name, type, is_public)
  VALUES (NEW.id, 'À voir au cinema', 'system', FALSE)
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_default_list ON users;
CREATE TRIGGER trigger_create_default_list
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_list();

---------------------------------------
-- POLICY IMPORTANTES POUR LES USERS
---------------------------------------

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Lecture
CREATE POLICY "Users can select their own lists"
ON lists
FOR SELECT
USING (auth.uid() = user_id);

-- Insertion
CREATE POLICY "Users can insert their own lists"
ON lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Modification (custom seulement)
CREATE POLICY "Users can update their own custom lists"
ON lists
FOR UPDATE
USING (auth.uid() = user_id AND type != 'system');

-- Suppression (custom seulement)
CREATE POLICY "Users can delete their own custom lists"
ON lists
FOR DELETE
USING (auth.uid() = user_id AND type != 'system');

---------------------------------------
-- INDEX IMPORTANTS POUR LES RECHERCHES
---------------------------------------

CREATE INDEX IF NOT EXISTS idx_list_movies_movie_id ON list_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_list_movies_list_id ON list_movies(list_id);

CREATE INDEX IF NOT EXISTS idx_user_ratings_movie_id ON user_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON user_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_movie_id ON sessions(movie_id);
CREATE INDEX IF NOT EXISTS idx_sessions_cinema_id ON sessions(cinema_id);
CREATE INDEX IF NOT EXISTS idx_sessions_movie_starts_at ON sessions(movie_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_movies_allocine_id ON movies(allocine_id);
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_status ON notification_events(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_user_auth_providers_user_id ON user_auth_providers(user_id);

---------------------------------------
-- Commandes
---------------------------------------

-- VIDAGE 
TRUNCATE TABLE 
    movie_people,
    movie_keyword,
    movie_genre,
    movie_production_company,
    sessions,
    cinemas,
    keywords,
    genres,
    production_company,
    peoples,
    movie_trailers,
    list_movies,
    lists,
    user_ratings,
    user_devices,
    notification_events,
    user_auth_providers,
    movies,
    users
RESTART IDENTITY CASCADE;

-- DELETE
DROP TABLE IF EXISTS
    movie_people,
    movie_keyword,
    movie_genre,
    movie_production_company,
    sessions,
    cinemas,
    keywords,
    genres,
    production_company,
    peoples,
    movie_trailers,
    list_movies,
    lists,
    user_ratings,
    user_devices,
    notification_events,
    user_auth_providers,
    movies,
    users
CASCADE;

-- Suppression des users reel
DELETE FROM auth.users;

---------------------------------------
-- INSERT Cinema
---------------------------------------

INSERT INTO cinemas(name, address, image, wherefind, idallocine, city, postal_code, latitude, longitude)
VALUES
('Jeu de Paume', '1 Pl. de la Concorde 75001 Paris', NULL, 'allocine', 'W7588', 'Paris', '75001', NULL, NULL),
('UGC Ciné Cité Les Halles', '7 Place de la Rotonde 75001 Paris', NULL, 'allocine', 'C0159', 'Paris', '75001', NULL, NULL),
('Grand Rex', '1 Bd Poissonnière, 75002 Paris', NULL, 'allocine', 'C0065', 'Paris', '75002', NULL, NULL),
('Pathé BNP Paribas', 'Opéra Premier, 32 Rue Louis le Grand, 75002 Paris', NULL, 'allocine', 'C0060', 'Paris', '75002', NULL, NULL),
('MK2 Beaubourg', '50 Rue Rambuteau, 75003 Paris', NULL, 'allocine', 'C0050', 'Paris', '75003', NULL, NULL),
('Luminor Hôtel de Ville', '20 Rue du Temple, 75004 Paris', NULL, 'allocine', 'C0013', 'Paris', '75004', NULL, NULL),
('Cinéma du Panthéon', '13 Rue Victor Cousin, 75005 Paris', NULL, 'allocine', 'C0076', 'Paris', '75005', NULL, NULL),
('Écoles Cinéma Club', '23 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0071', 'Paris', '75005', NULL, NULL),
('Espace Saint-Michel', '7 Pl. Saint-Michel, 75005 Paris', NULL, 'allocine', 'C0117', 'Paris', '75005', NULL, NULL),
('Le Grand Action', '5 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0072', 'Paris', '75005', NULL, NULL),
('La Filmothèque du Quartier latin', '9 Rue Champollion, 75005 Paris', NULL, 'allocine', 'C0020', 'Paris', '75005', NULL, NULL),
('Le Champo', '51 Rue des Écoles, 75005 Paris', NULL, 'allocine', 'C0073', 'Paris', '75005', NULL, NULL),
('L''Épée de bois', '100 Rue Mouffetard, 75005 Paris', NULL, 'allocine', 'W7504', 'Paris', '75005', NULL, NULL),
('Reflet Médicis', '3 Rue Champollion, 75005 Paris', NULL, 'allocine', 'C0074', 'Paris', '75005', NULL, NULL),
('Studio des Ursulines', '10 Rue des Ursulines, 75005 Paris', NULL, 'allocine', 'C0083', 'Paris', '75005', NULL, NULL),
('Studio Galande', '42 Rue Galande, 75005 Paris', NULL, 'allocine', 'C0016', 'Paris', '75005', NULL, NULL),
('Christine Cinéma Club', '4 Rue Christine, 75006 Paris', NULL, 'allocine', 'C0015', 'Paris', '75006', NULL, NULL),
('L''Arlequin', '76 Rue de Rennes, 75006 Paris', NULL, 'allocine', 'C0054', 'Paris', '75006', NULL, NULL),
('Les 3 Luxembourg', '67 Rue Monsieur le Prince, 75006 Paris', NULL, 'allocine', 'C0095', 'Paris', '75006', NULL, NULL),
('Lucernaire', '53 Rue Notre Dame des Champs, 75006 Paris', NULL, 'allocine', 'C0093', 'Paris', '75006', NULL, NULL),
('MK2 Odéon (côté Saint-Germain)', '113, bd Saint-Germain 75006 Paris', NULL, 'allocine', 'C0097', 'Paris', '75006', NULL, NULL),
('MK2 Odéon (côté Saint-Michel)', '7, rue Hautefeuille, 75006 Paris', NULL, 'allocine', 'C0092', 'Paris', '75006', NULL, NULL),
('MK2 Parnasse', '11 rue Jules Chaplain, 75006 Paris', NULL, 'allocine', 'C0099', 'Paris', '75006', NULL, NULL),
('Nouvel Odéon', '6 rue de l''Ecole-de-Medecine, 75006 Paris', NULL, 'allocine', 'C0041', 'Paris', '75006', NULL, NULL),
('Saint-André des Arts', '30 Rue Saint-André des Arts, 75006 Paris', NULL, 'allocine', 'C0100', 'Paris', '75006', NULL, NULL),
('Le Saint-Germain-des-Prés', '22 Rue Guillaume Apollinaire, 75006 Paris', NULL, 'allocine', 'C0096', 'Paris', '75006', NULL, NULL),
('UGC Danton', '99 Bd Saint-Germain, 75006 Paris', NULL, 'allocine', 'C0102', 'Paris', '75006', NULL, NULL),
('UGC Montparnasse', '83 Bd du Montparnasse, 75006 Paris', NULL, 'allocine', 'C0103', 'Paris', '75006', NULL, NULL),
('UGC Odéon', '124 Bd Saint-Germain, 75006 Paris', NULL, 'allocine', 'C0104', 'Paris', '75006', NULL, NULL),
('UGC Rotonde', '103 Bd du Montparnasse, 75006 Paris', NULL, 'allocine', 'C0105', 'Paris', '75006', NULL, NULL),
('Cinéma Katara', '37 avenue Hoche, 75008 Paris', NULL, NULL, NULL, 'Paris', '75008', NULL, NULL),
('Élysées Biarritz', '22-24 Rue Quentin Bauchart, 75008 Paris', NULL, NULL, NULL, 'Paris', '75008', NULL, NULL),
('Élysées Lincoln', '14 Rue Lincoln, 75008 Paris', NULL, 'allocine', 'C0108', 'Paris', '75008', NULL, NULL),
('Le Balzac', '1 Rue Balzac, 75008 Paris', NULL, 'allocine', 'C0009', 'Paris', '75008', NULL, NULL),
('Publicis Cinémas', '129 Av. des Champs-Élysées, 75008 Paris', NULL, 'allocine', 'C6336', 'Paris', '75008', NULL, NULL),
('Les 5 Caumartin', '101 Rue Saint-Lazare, 75009 Paris', NULL, 'allocine', 'C0012', 'Paris', '75009', NULL, NULL),
('Max-Linder Panorama', '24 Bd Poissonnière, 75009 Paris', NULL, 'allocine', 'C0089', 'Paris', '75009', NULL, NULL),
('Pathé Palace', '2 Bd des Capucines, 75009 Paris', NULL, 'allocine', 'G02BG', 'Paris', '75009', NULL, NULL),
('UGC Opéra', '32 Bd des Italiens, 75009 Paris', NULL, 'allocine', 'C0126', 'Paris', '75009', NULL, NULL),
('L''Archipel', '17 Bd de Strasbourg, 75010 Paris', NULL, 'allocine', 'C0134', 'Paris', '75010', NULL, NULL),
('Le Brady', '39 Bd de Strasbourg, 75010 Paris', NULL, 'allocine', 'C0023', 'Paris', '75010', NULL, NULL),
('Le Louxor', '170 Bd de Magenta, 75010 Paris', NULL, 'allocine', 'W7510', 'Paris', '75010', NULL, NULL),
('Majestic Bastille', '4 Bd Richard-Lenoir, 75011 Paris', NULL, 'allocine', 'C0139', 'Paris', '75011', NULL, NULL),
('MK2 Bastille (côté Beaumarchais)', '4 Bd Beaumarchais, 75011 Paris', NULL, 'allocine', 'C0140', 'Paris', '75011', NULL, NULL),
('MK2 Bastille (côté Faubourg Saint-Antoine)', '5 rue du Faubourg-Saint-Antoine, 75011 Paris', NULL, 'allocine', 'C0040', 'Paris', '75011', NULL, NULL),
('MK2 Nation', '133 bd Diderot, 75012 Paris', NULL, 'allocine', 'C0144', 'Paris', '75012', NULL, NULL),
('UGC Ciné Cité Bercy', '2 Cr Saint-Emilion, 75012 Paris', NULL, 'allocine', 'C0026', 'Paris', '75012', NULL, NULL),
('UGC Lyon Bastille', '12 Rue de Lyon, 75012 Paris', NULL, 'allocine', 'C0146', 'Paris', '75012', NULL, NULL),
('L''Escurial', '11 Bd de Port-Royal, 75013 Paris', NULL, 'allocine', 'C0147', 'Paris', '75013', NULL, NULL),
('MK2 Bibliothèque', '128-162 avenue de France, 75013 Paris', NULL, 'allocine', 'C2954', 'Paris', '75013', NULL, NULL),
('MK2 Bibliothèque x Centre Pompidou', '128-162 Av. de France accès en face de l’entrée principale de la Bibliothèque Nationale Francois Mitterrand, 75013 Paris', NULL, 'allocine', 'C0127', 'Paris', '75013', NULL, NULL),
('Pathé Les Fauvettes', '58 Av. des Gobelins, 75013 Paris', NULL, 'allocine', 'C0024', 'Paris', '75013', NULL, NULL),
('UGC Gobelins', '66 bis Av. des Gobelins, 75013 Paris', NULL, 'allocine', 'C0150', 'Paris', '75013', NULL, NULL),
('7 Parnassiens', '98 Boulevard du Montparnasse, 75014 Paris', NULL, 'allocine', 'C0025', 'Paris', '75014', NULL, NULL),
('Chaplin Denfert', '24 Place Denfert-Rochereau, 75014 Paris', NULL, 'allocine', 'C0153', 'Paris', '75014', NULL, NULL),
('L''Entrepôt', '7 Rue Francis de Pressensé, 75014 Paris', NULL, 'allocine', 'C0005', 'Paris', '75014', NULL, NULL),
('Pathé Alésia', '73 Avenue  du Général Leclerc, 75014 Paris', NULL, 'allocine', 'C0037', 'Paris', '75014', NULL, NULL),
('Pathé Montparnos', '16 Rue d''Odessa, 75014 Paris', NULL, 'allocine', 'C0052', 'Paris', '75014', NULL, NULL),
('Pathé Parnasse', '3 Rue d''Odessa, 75014 Paris', NULL, 'allocine', 'C0158', 'Paris', '75014', NULL, NULL),
('Chaplin Saint-Lambert', '6 Rue Péclet, 75015 Paris', NULL, 'allocine', 'W7515', 'Paris', '75015', NULL, NULL),
('Pathé Aquaboulevard', '16 Rue du Colonel Pierre Avia, 75015 Paris', NULL, 'allocine', 'C0116', 'Paris', '75015', NULL, NULL),
('Pathé Beaugrenelle', '7 Rue Linois 75015 Paris', NULL, 'allocine', 'W7502', 'Paris', '75015', NULL, NULL),
('Pathé Convention', '27 Rue Alain Chartier, 75015 Paris', NULL, 'allocine', 'C0161', 'Paris', '75015', NULL, NULL),
('Majestic Passy', '18 Rue de Passy, 75016 Paris', NULL, 'allocine', 'C0120', 'Paris', '75016', NULL, NULL),
('7 Batignolles', '86 Rue Mstislav Rostropovitch, 75017 Paris', NULL, 'allocine', 'P7517', 'Paris', '75017', NULL, NULL),
('Cinéma des Cinéastes', '7 Avenue de Clichy, 75017 Paris', NULL, 'allocine', 'C0004', 'Paris', '75017', NULL, NULL),
('Club de l''Étoile', '14 Rue Troyon, 75017 Paris', NULL, 'allocine', 'W7517', 'Paris', '75017', NULL, NULL),
('Mac-Mahon', '5 Avenue Mac-Mahon, 75017 Paris', NULL, 'allocine', 'C0172', 'Paris', '75017', NULL, NULL),
('UGC Ciné Cité Maillot', '2 Pl de la Pte Maillot, 75017 Paris', NULL, 'allocine', 'C0175', 'Paris', '75017', NULL, NULL),
('Pathé Wepler', 'Côté Place, 140 Bd de Clichy, 75018 Paris', NULL, 'allocine', 'C0179', 'Paris', '75018', NULL, NULL),
('Studio 28', '10 Rue Tholozé, 75018 Paris', NULL, 'allocine', 'C0061', 'Paris', '75018', NULL, NULL),
('MK2 Quai de Loire', '7 Quai de la Loire, 75019 Paris', NULL, 'allocine', 'C1621', 'Paris', '75019', NULL, NULL),
('MK2 Quai de Seine', '14 Quai de la Seine, 75019 Paris', NULL, 'allocine', 'C0003', 'Paris', '75019', NULL, NULL),
('La Géode - IMAX', '26 Avenue Corentin-Cariou, 75019 Paris', NULL, 'allocine', 'C0189', 'Paris', '75019', NULL, NULL),
('Pathé La Villette', '30 Avenue. Corentin Cariou, 75019 Paris', NULL, 'allocine', 'W7520', 'Paris', '75019', NULL, NULL),
('UGC Ciné Cité Paris 19', '166 Bd Macdonald, 75019 Paris', NULL, 'allocine', 'W7509', 'Paris', '75019', NULL, NULL),
('CGR Paris - Lilas', 'Place du Maquis du Vercors, 75020 Paris', NULL, 'allocine', 'W7519', 'Paris', '75020', NULL, NULL),
('MK2 Gambetta', '6 Rue Belgrand, 75020 Paris', NULL, 'allocine', 'C0192', 'Paris', '75020', NULL, NULL);