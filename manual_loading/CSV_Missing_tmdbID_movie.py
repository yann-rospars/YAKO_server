import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scrapers.SupabaseManager import DBManager
import csv

def format_allocine_image(path):
    if not path:
        return ""
    return f"https://fr.web.img6.acsta.net{path}"

def export_missing_tmdb_csv():
    db = DBManager()

    movies = db.get_movies_without_tmdb_id()

    print(f"{len(movies)} films sans TMDB trouvés")

    output_path = os.path.join(os.path.dirname(__file__), "missing_tmdb_movies.csv")

    # ------------------------------------------------------------
    # 1. Lire les IDs déjà présents
    # ------------------------------------------------------------
    existing_ids = set()

    if os.path.exists(output_path):
        with open(output_path, newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file, delimiter=';')
            for row in reader:
                existing_ids.add(row["movie_id"])

    print(f"{len(existing_ids)} films déjà présents dans le CSV")

    # ------------------------------------------------------------
    # 2. Ouvrir en mode append
    # ------------------------------------------------------------
    file_exists = os.path.exists(output_path)

    with open(output_path, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file, delimiter=';')

        # écrire header seulement si fichier n'existe pas
        if not file_exists:
            writer.writerow([
                "movie_id",
                "tmdb_id",
                "title",
                "original_title",
                "overview",
                "poster_path",
                "release_date",
                "runtime",
                "directors"
            ])

        # ------------------------------------------------------------
        # 3. Ajouter uniquement les nouveaux films
        # ------------------------------------------------------------
        added = 0

        for m in movies:
            movie_id = str(m.get("id"))

            if movie_id in existing_ids:
                continue  # 🔥 déjà présent → skip

            directors_obj = db.get_movie_directors(m.get("id"))
            directors = [d.name for d in directors_obj if d.name]

            writer.writerow([
                movie_id,
                "",
                m.get("title"),
                m.get("original_title"),
                m.get("overview"),
                format_allocine_image(m.get("poster_path")),
                m.get("release_date"),
                m.get("runtime"),
                ", ".join(directors)
            ])

            added += 1

    print(f"{added} nouveaux films ajoutés au CSV")
    print(f"CSV mis à jour : {output_path}")


if __name__ == "__main__":
    export_missing_tmdb_csv()