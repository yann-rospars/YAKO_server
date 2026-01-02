import psycopg2
import time
import random

# --- Connexion AlwaysData ---
conn = psycopg2.connect(
    host="postgresql-rospars.alwaysdata.net",
    database="rospars_yako",
    user="rospars",
    password="Megakiller38%",
)

cursor = conn.cursor()

N = 100   # nombre de cycles lecture + écriture

# Requête d’insertion (paramétrée)
INSERT_QUERY = """
INSERT INTO movies (
    allocine_id,
    tmdb_id,
    title,
    original_title,
    is_adult,
    original_language,
    overview,
    en_overview,
    popularity,
    poster_path,
    release_date,
    revenue,
    budget,
    runtime,
    vote_average,
    vote_count,
    spoken_languages
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
)
RETURNING id;
"""

# Requête de lecture
SELECT_QUERY = """
SELECT * FROM movies WHERE tmdb_id = %s;
"""

def test_loop(n_cycles):
    print(f"=== Test AlwaysData PostgreSQL : {n_cycles} cycles lecture + écriture ===")

    total_insert_time = 0
    total_read_time = 0

    for i in range(n_cycles):
        # 1 — création film aléatoire
        tmdb_id = 10000000 + i
        movie = (
            random.randint(1, 10**9),     # allocine_id
            tmdb_id,
            f"TestMovie{i}",               # title
            f"OriginalTestMovie{i}",       # original_title
            False,                         # is_adult
            "en",                          # original_language
            "Benchmark movie",             # overview
            "Benchmark movie",             # en_overview
            random.uniform(0, 100),        # popularity
            "/test.jpg",                   # poster
            "2024-01-01",                  # release_date
            123456,                        # revenue
            654321,                        # budget
            120,                           # runtime
            7.5,                           # vote_average
            100,                           # vote_count
            ['en']                         # spoken_languages
        )

        # 2 — INSERT TEST
        t0 = time.time()
        cursor.execute(INSERT_QUERY, movie)
        conn.commit()
        insert_time = time.time() - t0
        total_insert_time += insert_time

        # 3 — READ TEST
        t0 = time.time()
        cursor.execute(SELECT_QUERY, (tmdb_id,))
        cursor.fetchall()
        read_time = time.time() - t0
        total_read_time += read_time

        print(f"[{i+1}/{n_cycles}] insert={insert_time:.4f}s | read={read_time:.4f}s")

    print("\n=== Résultats AlwaysData ===")
    print(f"Insertion moyenne : {total_insert_time / n_cycles:.4f} sec")
    print(f"Lecture moyenne   : {total_read_time / n_cycles:.4f} sec")
    print(f"Temps total       : {total_insert_time + total_read_time:.2f} sec")


if __name__ == "__main__":
    test_loop(N)
