THEME_NAME := codam
THEME_DIR := /usr/share/web-greeter/themes

# Absolute path to the project directory, required for symbolic links
# or when 'make' is run from another directory.
# - credit: https://stackoverflow.com/a/23324703/2726733
ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# Theme of the codam-web-greeter client
# can either be 'light' or 'dark', default is 'dark'
CLIENT_THEME := dark
# Add a background color to the form of the login/unlock screen (for better readability if your wallpaper requires this)
# if set to 'boxed' the form will have a background color
CLIENT_THEME_BOXED :=

# Detect MacOS
ifeq ($(shell uname),Darwin)
	SED := sed -i ''
else
	SED := sed -i
endif

# CLIENT
all: build

npm-install:
	npm install

build: static/greeter.css npm-install copy-files
	npm run build
	npm run bundle

copy-files:
ifeq ($(CLIENT_THEME), light)
	$(MAKE) use-light-theme
else # fallback to dark theme
	$(MAKE) use-dark-theme
endif
ifeq ($(CLIENT_THEME_BOXED), boxed)
	$(MAKE) use-boxed-theme
else # fallback to no boxed theme
	$(MAKE) no-boxed-theme
endif
	mkdir -p "$(ROOT_DIR)/dist"
	cp README.md LICENSE package.json "$(ROOT_DIR)/dist"
	cp -r "$(ROOT_DIR)/static/"* "$(ROOT_DIR)/dist"

install: build
	install -dm755 $(THEME_DIR)/$(THEME_NAME)
	cp -r "$(ROOT_DIR)/dist"/* "$(THEME_DIR)/$(THEME_NAME)"
	bash "$(ROOT_DIR)/systemd/install.sh"
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to enable the Codam theme"

uninstall:
	rm -r "$(THEME_DIR)/$(THEME_NAME)"
	[ -f /usr/share/codam/uninstall-codam-web-greeter-service.sh ] && bash /usr/share/codam/uninstall-codam-web-greeter-service.sh
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to disable the Codam theme if needed"

re:
	rm -f "$(ROOT_DIR)/static/greeter.css"
	rm -rf "$(ROOT_DIR)/build"
	rm -rf "$(ROOT_DIR)/dist"
	make build

# CLIENT THEMING
static/greeter.css:
	echo "@import 'css/styles.css';" > "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/dark.css';" >> "$(ROOT_DIR)/static/greeter.css"

use-light-theme:
	$(SED) 's/dark.css/light.css/' "$(ROOT_DIR)/static/greeter.css"

use-dark-theme:
	$(SED) 's/light.css/dark.css/' "$(ROOT_DIR)/static/greeter.css"

use-boxed-theme:
	echo "@import 'css/boxed.css';" >> "$(ROOT_DIR)/static/greeter.css"

no-boxed-theme:
	$(SED) '/boxed.css/d' "$(ROOT_DIR)/static/greeter.css"

# SERVER
update_server_version:
	bash "$(ROOT_DIR)/server/match_versions.sh"

server: update_server_version
	[ -f $(ROOT_DIR)/server/messages.json ] || echo '{}' > "$(ROOT_DIR)/server/messages.json"
	cd $(ROOT_DIR)/server
	docker compose -f "$(ROOT_DIR)/server/docker-compose.yaml" up -d

server-stop:
	cd $(ROOT_DIR)/server
	docker compose -f "$(ROOT_DIR)/server/docker-compose.yaml" down

.PHONY: all npm-install build copy-files install uninstall re use-light-theme use-boxed-theme server update_server_version server-stop
