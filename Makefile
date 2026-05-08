.PHONY: lockfile test build up down dev logs clean rebuild

# Generate package-lock.json without installing on the host
lockfile:
	docker run --rm -v "$(PWD):/app" -w /app node:20-alpine \
		npm install --package-lock-only --ignore-scripts

# Run vitest in a one-shot container
test:
	docker build --target test -t subnet-calculator:test .

# Build the production image
build:
	docker compose build app

# Bring the production app up at http://localhost:8080
up:
	docker compose up -d --build app
	@echo "Subnet calculator running at http://localhost:8080"

down:
	docker compose down

# Run vite dev server with HMR at http://localhost:5173
dev:
	docker compose --profile dev up --build dev

logs:
	docker compose logs -f app

clean:
	docker compose down -v
	docker rmi subnet-calculator:latest subnet-calculator:test 2>/dev/null || true

rebuild: clean up
