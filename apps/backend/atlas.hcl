env "local" {
  src = "file://drizzle"
  dev = "docker://postgres/16/dev?search_path=public"
  url = getenv("DATABASE_URL")
}
