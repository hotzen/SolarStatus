#!/bin/bash

# http://smartmontools.sourceforge.net/man/smartctl.8.html
SMARTCTL=/opt/omni/sbin/smartctl

# http://sourceforge.net/apps/trac/smartmontools/wiki/Powermode
POWERMODE=sleep

# adapt device-type if required, sat,12 is solaris-style SATA
DEVTYPE=sat,12

# comment out to debug smartctl output
QUIET="--quietmode=silent"

# output messages
STDOUT=1

# do not touch
IDLE=0

for DISK in "$@"
do
  sudo $SMARTCTL $QUIET --attributes --nocheck=$POWERMODE --device=$DEVTYPE $DISK
  RC=$?

  if [ $RC -ne 0 ]; then
	IDLE=1
	[ $STDOUT -eq 1 ] && echo "$DISK is sleeping."
  fi 
done

if [ $IDLE -eq 0 ]; then
	exit 0 # all disks are spinning
else
	exit 1 # some disks are idle
fi