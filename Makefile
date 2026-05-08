.PHONY: lockfile test build up down dev logs clean rebuild

lockfile:
	docker run --rm -v "$(PWD):/app" -w /app node:20-alpine \
		npm install --package-lock-only --ignore-scripts

test:
	docker build --target test -t subnet-calculator:test .

build:
	docker compose build app

up:
	docker compose up -d --build app
	@echo "Subnet calculator running at http://localhost:8080"

down:
	docker compose down

dev:
	docker compose --profile dev up --build dev

logs:
	docker compose logs -f app

clean:
	docker compose down -v
	docker rmi subnet-calculator:latest subnet-calculator:test 2>/dev/null || true

rebuild: clean up
