#!/bin/sh
# An empty file named "ssh" on the boot partition (the FAT partition a PC can write) turns
# SSH on for this boot. Remove the file to turn it off again.
if [ -f /boot/firmware/ssh ]; then
  systemctl start ssh
fi
