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

    with open(output_path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file, delimiter=';')

        # header
        writer.writerow([
            "movie_id",
            "tmdb_id",
            "title",
            "original_title",
            "overview",
            "poster_path",
            "release_date",
            "runtime"
        ])

        # data
        for m in movies:
            writer.writerow([
                m.get("id"),
                "",  # tmdb_id vide
                m.get("title"),
                m.get("original_title"),
                m.get("overview"),
                format_allocine_image(m.get("poster_path")),  # 🔥 modif ici
                m.get("release_date"),
                m.get("runtime")
            ])

    print(f"CSV généré : {output_path}")


if __name__ == "__main__":
    export_missing_tmdb_csv()