# Codam Web Greeter
A greeter theme for [nody-greeter](https://github.com/JezerM/nody-greeter)/web-greeter in LightDM, made specifically for [Codam Coding College](https://codam.nl/en).

---

## Installation

> Caution: make sure you know how to restore your system if something goes wrong. This theme is made specifically for Codam and if it doesn't work elsewhere, you're on your own.

1. Install *nody-greeter*:
```bash
sudo apt install nody-greeter=1.5.2
```
Alternatively, you can install it by compiling from source from the [nody-greeter repository](https://github.com/codam-coding-college/nody-greeter). Don't forget to clone the repository with the `--recursive` flag to include the submodules.

2. Clone this repository
```bash
git clone https://github.com/codam-coding-college/codam-web-greeter
```

3. Run make to build the greeter
```bash
cd codam-web-greeter
make
```

4. Install the greeter theme:
```
sudo make install
```

5. Enable the nody-greeter greeter in LightDM by editing *nano /etc/lightdm/lightdm.conf*:
```conf
# Add the following line to the file under [SeatDefaults]:
greeter-session=nody-greeter
```

6. Enable the greeter theme in nody-greeter by editing */etc/lightdm/web-greeter.yml*:
```yml
# Replace the theme name with codam-web-greeter:
greeter:
    theme: codam
```

7. Restart LightDM:
```bash
sudo systemctl restart lightdm
```
