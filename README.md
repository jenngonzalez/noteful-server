# Noteful Server

## How to seed database:
psql -U noteful-admin -d noteful -f ./seeds/seed.noteful_folders.sql
psql -U noteful-admin -d noteful -f ./seeds/seed.noteful_notes.sql