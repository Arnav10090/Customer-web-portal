import psycopg2

try:
    conn = psycopg2.connect('dbname=TTMS user=postgres host=localhost')
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Users' ORDER BY ordinal_position")
    print("Current columns in Users table:")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
