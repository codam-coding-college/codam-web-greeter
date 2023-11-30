THEME_NAME := codam
THEME_DIR := /usr/share/web-greeter/themes

# Absolute path to the project directory, required for symbolic links
# or when 'make' is run from another directory.
# - credit: https://stackoverflow.com/a/23324703/2726733
ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

all: build

npm-install:
	npm install

build: npm-install copy-files
	npm run build
	npm run bundle

copy-files:
	mkdir -p $(ROOT_DIR)/dist
	cp README.md LICENSE $(ROOT_DIR)/dist
	cp -r $(ROOT_DIR)/public/* $(ROOT_DIR)/dist

install: build
	install -dm755 $(THEME_DIR)/$(THEME_NAME)
	cp -r $(ROOT_DIR)/dist/* $(THEME_DIR)/$(THEME_NAME)
	bash $(ROOT_DIR)/systemd/install.sh
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to enable the Codam theme"

uninstall:
	rm -r $(THEME_DIR)/$(THEME_NAME)
	[ -f /usr/share/codam/uninstall-codam-web-greeter-service.sh ] && bash /usr/share/codam/uninstall-codam-web-greeter-service.sh
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to disable the Codam theme if needed"

update_server_version:
	bash $(ROOT_DIR)/server/match_versions.sh

server: update_server_version
	cd $(ROOT_DIR)/server
	docker compose -f $(ROOT_DIR)/server/docker-compose.yaml up -d

server-stop:
	cd $(ROOT_DIR)/server
	docker compose -f $(ROOT_DIR)/server/docker-compose.yaml down

re:
	rm -rf $(ROOT_DIR)/build
	rm -rf $(ROOT_DIR)/dist
	make build

.PHONY: all npm-install build copy-files install uninstall server update_server_version re
