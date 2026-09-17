[Unit]
Description=WebKontrol display session (X11, no desktop)
# Deliberately no wait for network-online or time sync: a display with the cable out must
# still show its screen, and the app retries page loads on its own once the network is up.
After=network.target
# tty1 belongs to this session, not to a login prompt.
Conflicts=getty@tty1.service
After=getty@tty1.service

[Service]
User=$WEBKONTROL_USER
# No PAMName=login: the account's password is expired until the first SSH login (chage -d 0
# in the layer), and a PAM login session for an expired account is refused, which kept
# this unit in a restart loop on a fresh box (2026-09-17). X gets its device access from
# the setuid wrapper, so no logind session is needed.
TTYPath=/dev/tty1
StandardInput=tty
StandardOutput=journal
StandardError=journal
WorkingDirectory=/opt/webkontrol
# Reaches the in-app updater through the supervisor: Puppeteer's Chromium is x86-64 on ARM.
Environment=PUPPETEER_SKIP_DOWNLOAD=true
ExecStart=/usr/bin/xinit /usr/local/bin/webkontrol-session -- /usr/bin/X :0 vt1 -nocursor -quiet
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
