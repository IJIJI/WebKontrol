[Unit]
Description=WebKontrol display session (X11, no desktop)
Wants=network-online.target
After=network-online.target systemd-time-wait-sync.service
# tty1 belongs to this session, not to a login prompt.
Conflicts=getty@tty1.service
After=getty@tty1.service

[Service]
User=$WEBKONTROL_USER
PAMName=login
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
