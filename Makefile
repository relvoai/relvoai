SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

API_DIR  := api
ADMIN_DIR := admin

.PHONY: help setup setup-api setup-admin dev dev-api dev-admin test test-api test-admin lint lint-api lint-admin build fresh clean

help:
	@echo "Relvo AI monorepo — make targets"
	@echo "  setup    — composer install + npm install + .env + key:generate + migrate --seed"
	@echo "  dev      — api + queue + reverb + admin Vite concurrently"
	@echo "  test     — backend Pest + admin tsc"
	@echo "  lint     — Pint + admin tsc"
	@echo "  build    — admin production + widget bundle"
	@echo "  fresh    — migrate:fresh --seed --force"
	@echo "  clean    — drop node_modules, vendor, build artifacts"

# ---------- setup ----------

setup: setup-api setup-admin
	@echo "✓ Monorepo setup complete."

setup-api:
	@echo "→ api: composer install"
	cd $(API_DIR) && composer install --no-interaction --prefer-dist
	@echo "→ api: .env"
	@test -f $(API_DIR)/.env || cp $(API_DIR)/.env.example $(API_DIR)/.env
	@echo "→ api: key:generate"
	cd $(API_DIR) && php artisan key:generate --no-interaction
	@echo "→ api: migrate --seed"
	cd $(API_DIR) && php artisan migrate --seed --no-interaction --force

setup-admin:
	@echo "→ admin: npm install"
	cd $(ADMIN_DIR) && npm install
	@test -f $(ADMIN_DIR)/.env.local || ( test -f $(ADMIN_DIR)/.env.example && cp $(ADMIN_DIR)/.env.example $(ADMIN_DIR)/.env.local || true )

# ---------- dev ----------

dev:
	@echo "Starting api (serve), queue, reverb, admin (vite) concurrently…"
	@trap 'kill 0' INT TERM EXIT; \
	( cd $(API_DIR) && php artisan serve --host=127.0.0.1 --port=8000 ) & \
	( cd $(API_DIR) && php artisan queue:listen --tries=1 ) & \
	( cd $(API_DIR) && php artisan reverb:start ) & \
	( cd $(ADMIN_DIR) && npm run dev ) & \
	wait

dev-api:
	cd $(API_DIR) && php artisan serve --host=127.0.0.1 --port=8000

dev-admin:
	cd $(ADMIN_DIR) && npm run dev

# ---------- test ----------

test: test-api test-admin
	@echo "✓ All tests green."

test-api:
	cd $(API_DIR) && php artisan test

test-admin:
	cd $(ADMIN_DIR) && npx tsc --noEmit

# ---------- lint ----------

lint: lint-api lint-admin
	@echo "✓ Lint clean."

lint-api:
	cd $(API_DIR) && vendor/bin/pint --test

lint-admin:
	cd $(ADMIN_DIR) && npx tsc --noEmit

# ---------- build ----------

build:
	cd $(ADMIN_DIR) && npm run build
	@if grep -q '"build:widget"' $(ADMIN_DIR)/package.json; then \
		cd $(ADMIN_DIR) && npm run build:widget; \
	else \
		echo "skip: build:widget not defined in admin/package.json"; \
	fi

# ---------- fresh ----------

fresh:
	cd $(API_DIR) && php artisan migrate:fresh --seed --force

# ---------- clean ----------

clean:
	rm -rf $(API_DIR)/vendor $(API_DIR)/node_modules
	rm -rf $(ADMIN_DIR)/node_modules $(ADMIN_DIR)/dist $(ADMIN_DIR)/dist-widget
