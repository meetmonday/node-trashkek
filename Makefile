ifneq ($(MAKECMDGOALS),env-dump)
include .env
endif

.PHONY: help

DOCKER_COMPOSE_OPTIONS = -f docker-compose.yaml
DOCKER_COMPOSE = docker-compose $(DOCKER_COMPOSE_OPTIONS)

help: ## Displays help for a command
	@printf "\033[33mUsage:\033[0m\n  make [options] [target] ...\n\n\033[33mAvailable targets:%-13s\033[0m\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' 'Makefile' | awk 'BEGIN {FS = ":.*?## "}; {printf "%-2s\033[32m%-17s\033[0m %s\n", "", $$1, $$2}'

container-build: ## Builds the application's docker containers
	$(DOCKER_COMPOSE) build --parallel --compress --force-rm

container-down: ## Shutdown docker application containers
	$(DOCKER_COMPOSE) down --remove-orphans

container-up: ## Launches docker application containers
	$(DOCKER_COMPOSE) up --detach --remove-orphans --force-recreate
	$(DOCKER_COMPOSE) ps

env-dump: ## Merge current environment with dotenv file
	@[ "$(wildcard $(src))" ] || (echo "Please, specify valid environment file in src argument"; exit 22)
	@[ "$(dest)" ] || (echo "Please, specify dest argument"; exit 22)
	printenv | awk '/^[^#].+$$/ {sub(/=/," ");c[$$1]++;if(2==c[$$1]){print $$1"="$$2}}' $(src) - $(src) > $(dest)

run: ## Executes the application launch
	$(MAKE) container-build
	$(MAKE) container-up
