ifneq ($(MAKECMDGOALS),env-dump)
-include .env
export
endif

.PHONY: help

DOCKER_COMPOSE_OPTIONS = -f docker-compose.yaml
DOCKER_COMPOSE = docker-compose $(DOCKER_COMPOSE_OPTIONS)

help: ## Displays help for a command
	@printf "\033[33mUsage:\033[0m\n  make [options] [target] ...\n\n\033[33mAvailable targets:%-13s\033[0m\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' 'Makefile' | awk 'BEGIN {FS = ":.*?## "}; {printf "%-2s\033[32m%-17s\033[0m %s\n", "", $$1, $$2}'

container-down: ## Shutdown docker application containers
	$(DOCKER_COMPOSE) down --remove-orphans

container-pull:
	$(DOCKER_COMPOSE) pull

container-up: ## Launches docker application containers
	$(DOCKER_COMPOSE) up --detach --remove-orphans --force-recreate
	$(DOCKER_COMPOSE) ps

env-dump: ## Merge current environment with dotenv file
	@[ "$(wildcard $(src))" ] || (echo "Please, specify valid environment file in src argument"; exit 22)
	@[ "$(dest)" ] || (echo "Please, specify dest argument"; exit 22)
	printenv | awk '/^[^#].+$$/ {sub(/=/," ");c[$$1]++;if(2==c[$$1]){print $$1"="$$2}}' $(src) - $(src) > $(dest)

run: ## Executes the application launch
	$(MAKE) container-pull
	$(MAKE) container-up

backup: ## Create a timestamped backup of the bipki database
	@if [ -f data/bipki.db ]; then \
		mkdir -p data/backups; \
		ts=$$(date +%FT%H-%M-%S); \
		cp data/bipki.db "data/backups/bipki-$$ts.db"; \
		cp data/bipki.db-wal "data/backups/bipki-$$ts.db-wal" 2>/dev/null || true; \
		cp data/bipki.db-shm "data/backups/bipki-$$ts.db-shm" 2>/dev/null || true; \
		echo "Backup created: data/backups/bipki-$$ts.db"; \
	else \
		echo "No database found at data/bipki.db"; \
	fi

backup-restore: ## Restore the latest backup (usage: make backup-restore FILE=data/backups/bipki-....db)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make backup-restore FILE=data/backups/bipki-XXXX.db"; \
		exit 22; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "File not found: $(FILE)"; \
		exit 22; \
	fi
	cp "$(FILE)" data/bipki.db
	echo "Restored from $(FILE)"
