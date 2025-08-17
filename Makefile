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
	cd "$(ROOT_DIR)/client" && npm install

build: clean client/static/greeter.css client/static/settings.json npm-install copy-files
	cd "$(ROOT_DIR)/client" && npm run build && npm run bundle

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
	mkdir -p "$(ROOT_DIR)/client/dist"
	cp README.md LICENSE client/package.json "$(ROOT_DIR)/client/dist"
	cp -r "$(ROOT_DIR)/client/static/"* "$(ROOT_DIR)/client/dist"

install: build
	install -dm755 $(THEME_DIR)/$(THEME_NAME)
	cp -r "$(ROOT_DIR)/client/dist"/* "$(THEME_DIR)/$(THEME_NAME)"
	bash "$(ROOT_DIR)/client/systemd/install.sh"
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to enable the Codam theme"

uninstall:
	rm -r "$(THEME_DIR)/$(THEME_NAME)"
	[ -f /usr/share/codam/uninstall-codam-web-greeter-service.sh ] && bash /usr/share/codam/uninstall-codam-web-greeter-service.sh
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to disable the Codam theme if needed"

re: clean
	make build

clean:
	rm -f "$(ROOT_DIR)/client/static/greeter.css"
	rm -rf "$(ROOT_DIR)/client/build"
	rm -rf "$(ROOT_DIR)/client/dist"

# SETTINGS FILE
client/static/settings.json:
	cp "$(ROOT_DIR)/client/static/settings.default.json" "$(ROOT_DIR)/client/static/settings.json"

# CLIENT THEMING
client/static/greeter.css:
	echo "@import 'css/styles.css';" > "$(ROOT_DIR)/client/static/greeter.css"
	echo "@import 'css/dark.css';" >> "$(ROOT_DIR)/client/static/greeter.css"

use-light-theme:
	$(SED) 's/dark.css/light.css/' "$(ROOT_DIR)/client/static/greeter.css"

use-dark-theme:
	$(SED) 's/light.css/dark.css/' "$(ROOT_DIR)/client/static/greeter.css"

use-boxed-theme:
	echo "@import 'css/boxed.css';" >> "$(ROOT_DIR)/client/static/greeter.css"

no-boxed-theme:
	$(SED) '/boxed.css/d' "$(ROOT_DIR)/client/static/greeter.css"

# SERVER
update-server-version:
	bash "$(ROOT_DIR)/server/match_versions.sh"

server/messages.json:
	echo '{}' > "$(ROOT_DIR)/server/messages.json"

server: update-server-version server/messages.json
	docker compose -f "$(ROOT_DIR)/server/docker-compose.yaml" up -d

server-stop:
	docker compose -f "$(ROOT_DIR)/server/docker-compose.yaml" down

.PHONY: all npm-install build copy-files install uninstall re use-light-theme use-boxed-theme server update-server-version server-stop clean
