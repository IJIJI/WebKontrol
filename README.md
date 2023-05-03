# WebKontrol

[![License](https://img.shields.io/github/license/IJIJI/WebKontrol)](https://github.com/IJIJI/WebKontrol/blob/main/LICENSE) [![Version](https://img.shields.io/github/v/release/IJIJI/WebKontrol?display_name=tag&include_prereleases)](https://github.com/IJIJI/WebKontrol/releases)

An intuitive web kiosk with a web based admin panel.

<img src="img/admin_interface.png" width="400"/> <img src="img/clock_interface.png" width="400"/>

I originally developed this for the livestreaming industry. This allows me to display a clock, but also use something like [stagetimer.io](https://stagetimer.io/). This can also be implemented in an information display, or even a touchscreen kiosk.

> ⚠️ **This is not yet fully developed, and the code is not perfect. I will continue developing this. In its current state I have tested the platform to be stable.**

# Getting started

I am planning to sell pre-configured boxes on my store. If you are interested, [contact me](mailto:shop@synapt.nl).

## Install

WebKontrol is Python based, which means it can run on a lot of operating systems. It is tested on **windows 11** and **Raspberry Pi OS (Desktop).** The first part of the install is interchangable between both, but make sure you have python, pip and git installed.

#### Dependencies

```shell
pip install selenium
pip install flask
pip install threading
pip install netifaces
sudo apt-get install chromium-browser
```

#### Code

```shell
git clone https://github.com/IJIJI/WebKontrol.git --branch V0.3
cd WebKontrol/src
python WebKontrol.py
```

#### Autostart (Raspberry Pi OS)

```shell
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add the python script to the end of the startup file. Your location may differ.

```shell
@python /home/pi/Webkontrol/src/WebKontrol.py
```

#### Auto hide the cursor (Raspberry Pi OS)

```shell
sudo apt-get install unclutter
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add the unclutter script to the end of the startup file. You can change the timeout, it is set to 2.

```shell
@unclutter -idle 2
```
