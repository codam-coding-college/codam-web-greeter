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

copy-files:
	mkdir -p $(ROOT_DIR)/dist
	cp README.md LICENSE $(ROOT_DIR)/dist
	cp -r $(ROOT_DIR)/public/* $(ROOT_DIR)/dist

install:
	install -dm755 $(THEME_DIR)/$(THEME_NAME)
	cp -r $(ROOT_DIR)/dist/* $(THEME_DIR)/$(THEME_NAME)
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to enable the Codam theme"

uninstall:
	rm -r $(THEME_DIR)/$(THEME_NAME)
	@echo "Update your /etc/lightdm/web-greeter.yml config file manually to disable the Codam theme if needed"
