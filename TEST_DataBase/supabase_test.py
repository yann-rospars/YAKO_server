import time
from supabase import create_client
import random

SUPABASE_URL = "https://hkhmipoxoetjzplqjctr.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraG1pcG94b2V0anpwbHFqY3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMDY1NywiZXhwIjoyMDc5OTA2NjU3fQ.FnTtDb1oSEhr1-Lky81jep4lBhnFJs9-6hgejFgACVo"
# Home > Section API > View API Setings > API Key 

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

N = 100   # nombre de cycles lecture + écriture

def test_loop(n_cycles):
    print(f"=== Test Supabase : {n_cycles} cycles lecture + écriture ===")

    total_insert_time = 0
    total_read_time = 0

    for i in range(n_cycles):
        # 1. TEST INSERT
        movie = {
            "tmdb_id": 10_000_000 + i,
            "title": f"TestMovie{i}",
            "original_title": f"OriginalTestMovie{i}",
            "is_adult": False,
            "original_language": "en",
            "overview": "Benchmark test movie",
            "en_overview": "Benchmark test movie",
            "popularity": random.uniform(0, 100),
            "poster_path": "/test.jpg",
            "release_date": "2024-01-01",
            "revenue": 123456,
            "budget": 654321,
            "runtime": 123,
            "vote_average": 5.5,
            "vote_count": 10,
            "spoken_languages": ["en"]
        }

        t0 = time.time()
        supabase.table("movies").insert(movie).execute()
        insert_time = time.time() - t0
        total_insert_time += insert_time

        # 2. TEST READ
        t0 = time.time()
        supabase.table("movies").select("*").eq("tmdb_id", movie["tmdb_id"]).execute()
        read_time = time.time() - t0
        total_read_time += read_time

        print(f"[{i+1}/{n_cycles}] insert={insert_time:.4f}s | read={read_time:.4f}s")

    print("\n=== Résultats ===")
    print(f"Insertion moyenne : {total_insert_time / n_cycles:.4f} sec")
    print(f"Lecture moyenne   : {total_read_time / n_cycles:.4f} sec")
    print(f"Temps total       : {total_insert_time + total_read_time:.2f} sec")


if __name__ == "__main__":
    test_loop(N)