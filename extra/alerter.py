# [H]ardForum
# http://hardforum.com/showthread.php?t=1595773

import os
import sys
import smtplib
import mimetypes
from email.Encoders import encode_base64
from email.MIMEBase import MIMEBase
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText


# =====================================
# CONFIG

TEST = False

MAIL_FROM = 'your-nas@host.tld'
MAIL_TO   = 'you@host.tld'
MAIL_HOST = 'smtp.host.tld'
MAIL_PORT = 25 # 465 SSL/TLS
MAIL_USER = 'user'
MAIL_PASS = 'pass'

MAIL_ALL_OK = True # Even send an EMail if everything is OK

CMD_SVCS     = '/usr/bin/svcs'
CMD_ZPOOL    = '/sbin/zpool'
CMD_SMARTCTL = '/opt/smartmon/sbin/smartctl'

DISKS = [
    '/dev/rdsk/c8t1d0'
  , '/dev/rdsk/c8t2d0'
  , '/dev/rdsk/c8t3d0'
]


# =====================================
# LIB

# open a connection to the SMTP-Server
def initSMTP():
  try:
    # USE SSL/TLS INSTEAD
    #s = smtplib.SMTP_SSL(MAIL_HOST, MAIL_PORT)
    s = smtplib.SMTP(MAIL_HOST, MAIL_PORT)

    # DETAILED TRACE
    # s.set_debuglevel(1)

    s.login(MAIL_USER, MAIL_PASS)
    return s
  except Exception, e:
    print e
    sys.exit(1)

# close the SMTP-connection
def closeSMTP(s):
  s.quit()
  s.close()

# send an E-Mail using specified SMTP-Connection
def sendMail(s, subj, body):
  try:
    msg = MIMEMultipart()
    msg['From']    = MAIL_FROM
    msg['To']      = MAIL_TO
    msg['Subject'] = subj
    msg.attach(MIMEText(body))
	
    s.sendmail(MAIL_FROM, MAIL_TO.split(";"), msg.as_string())
  except Exception, e:
    print e
    sys.exit(1)

# execute a command and return its output
def cmd(c):
  try:
    proc = os.popen(c)
    out  = proc.read().strip()
    return out
  except Exception, e:
    print e
    sys.exit(1)

# create a summary-text of failed-command's output and additional details
def summary(failed, details):
  s  = failed
  s += "\n----------\n\n"
  s += details
  return s


# =====================================
# START
alert = False

# connect to SMTP
s = initSMTP()

# Services
svcsX = cmd(CMD_SVCS + ' -x')
if TEST or len(svcsX) > 0:
  alert = True
  svcsXV = cmd(CMD_SVCS + ' -x -v')
  txt = summary(svcsX, svcsXV)
  sendMail(s, "[NAS] Services failed", txt)

# ZFS Pool checking
zpoolStatusX = cmd(CMD_ZPOOL + ' status -x')
if TEST or zpoolStatusX.find("all pools are healthy") == -1:
  alert = True
  zpoolStatus = cmd(CMD_ZPOOL + ' status')
  txt = summary(zpoolStatusX, zpoolStatus)
  sendMail(s, "[NAS] ZFS Pool Status", txt)

# SMART checking
for disk in DISKS:
  smartHealth = cmd(CMD_SMARTCTL + ' --health -d sat,12 ' + disk)
  if TEST or smartHealth.find("PASSED") == -1:
    alert = True
    smart = cmd(CMD_SMARTCTL + ' --all -d sat,12 ' + disk)
    txt   = summary(smartHealth, smart)
    sendMail(s, "[NAS] S.M.A.R.T. " + disk, txt)

# OK
if alert == False and MAIL_ALL_OK == True:
  sendMail(s, "[NAS] O.K.", "Everything is fine")

closeSMTP(s)
sys.exit(0)
