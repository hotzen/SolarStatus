; <?php exit; ?>
script_dir = ./scripts

;################################################
; Support for nicstat <http://www.brendangregg.com/Perf/network.html#nicstat>
; comment out to disable
nicstat = nicstat


;################################################
; Support for smartmontools <http://smartmontools.sourceforge.net>
; Manual:
;     http://smartmontools.sourceforge.net/man/smartctl.8.html
;     http://sourceforge.net/apps/trac/smartmontools/wiki/Powermode
; comment out to disable
;
; smartmon requires raw disk access via /dev/rdsk/, see man-page link above!
smartctl   = /opt/smartmon/sbin/smartctl


;################################################
; authentication - comment out to disable
[auth]
password = f00bar

; used to generate hashs, tokens and challenges. please change it.
secret   = 9d9c8a3fb07ccb2c7a56d2f89b2dee6f

; time after a token is expired, the token is refreshed each time
; SolarStatus is reloaded or an AJAX-request is successfully executed
expire = 300

;################################################
; device-sets, where each set contains N devices.
; A device-set can be used in commands by using the macro %DEVSET-<NUM> which is expanded to its devices.
; If %DEVSET-X contains 3 devices, a command using this devset is expanded to 3 individual commands, where each command uses one of those 3 devices

; device-set #0: SSD/OS
[devset-0]
dev[] = /dev/rdsk/c8t0d0s0

; device-set #1: HDD/Storage
[devset-1]
;dev[] = /dev/rdsk/c8t1d0p0
;dev[] = /dev/rdsk/c8t2d0p0
;dev[] = /dev/rdsk/c8t3d0p0
dev[] = /dev/rdsk/c8t1d0
dev[] = /dev/rdsk/c8t2d0
dev[] = /dev/rdsk/c8t3d0



;################################################
; COMMANDS, where each command may use the folling variables/macros:
; 	%DEVSET-<ID>   a set of devices, configured above
; 	%SMARTCTL	   the path to smartctl, if configured above,
;	%NICSTAT	   the path to nicstat, if configured above
;
; each command-section begins with "command-", followed by the command's id

[commands]
; the sat,12 device-parameter results in dmesg: "Error for Command: <undecoded cmd 0xa1>    Error Level: Recovered"
; see http://sourceforge.net/mailarchive/message.php?msg_id=27470552
;smartctl_health = "%SMARTCTL --health -d sat,12 %DEVSET-1"

smartctl_health = "%SMARTCTL --health -d scsi %DEVSET-1"
;smartctl_health = "%SMARTCTL --health -d scsi %DEVSET-1 | tail -n +4"

smartctl_temp   = "%SMARTCTL --attributes -d sat,12 %DEVSET-1 | grep -i temperature"
smartctl_attr   = "%SMARTCTL --attributes -d sat,12 %DEVSET-1"
smartctl_info   = "%SMARTCTL --info -d sat,12 %DEVSET-1"
smartctl_all    = "%SMARTCTL --all -d sat,12 %DEVSET-1"

smartctl_test_res   = "%SMARTCTL --log=selftest -d sat,12 %DEVSET-1"
smartctl_test_short = "%SMARTCTL --test=short -d sat,12 %DEVSET-1"
smartctl_test_long  = "%SMARTCTL --test=long -d sat,12 %DEVSET-1"

; echo_devset1  = "echo %DEVSET-1"


;################################################
; FILTERS, that control which probes (actually HTML-Elements) are displayed.
;          The filter's number donates its order in the sequence of filters
;
; the following directives can be used:
;   label      The label of the filter, required
;   selector   CSS-selector, separate multiple selectors with comma (,)
;   default    Use the filter by default, optional

[filter-1]
label    = "CPU, I/O, TOP, NIC"
selector = "#mpstat, #zpool_iostat, #top, #nicstat"
default  = true

[filter-2]
label    = "Health"
selector = "#svcs_x, #dmesg, #smart_health"

[filter-10]
label    = "CPU"
selector = ".probe-cpu"

[filter-20]
label    = "I/O"
selector = ".probe-io"

[filter-30]
label    = "ZFS"
selector = ".probe-zfs"

[filter-40]
label    = "Processes"
selector = ".probe-ps"

[filter-50]
label    = "Services"
selector = ".probe-svcs"

[filter-60]
label    = "Logs"
selector = ".probe-logs"

[filter-70]
label    = "Hardware"
selector = ".probe-hw"

[filter-80]
label    = "S.M.A.R.T."
selector = ".probe-smart"

;################################################
; PROBES, each probe is a listing that displays either
;         the output of a script or of an configured command
;
; the following directives can be used:
;  label	The label of the probe, required
;  class	Arbitrary CSS-classes, primarily used for filtering the probes by above filters, recommended
;  script   EITHER name of a script in the scripts-directory
;  cmd      OR     id of a command configured above
;  order    An integer to determine the order in which the probes are displayed, optional

[probe-vmstat]
label  = "CPU (vmstat)"
class  = probe-cpu
script = vmstat
order  = 10

[probe-mpstat]
label  = "CPU-Cores (mpstat)"
class  = probe-cpu
script = mpstat
order  = 11

[probe-iostat]
label  = "I/O"
class  = probe-io
script = iostat
order  = 20

[probe-zpool_iostat]
label  = "ZFS I/O"
class  = "probe-zfs probe-io"
script = zpool_iostat
order  = 21

[probe-nicstat]
label  = "Network-Interfaces (<a href=\"http://www.brendangregg.com/K9Toolkit/nicstat.c\">nicstat</a>)"
class  = probe-io
script = nicstat
order  = 22

[probe-zpool_status]
label  = "ZFS Status"
class  = probe-zfs
script = zpool_status
order  = 31

[probe-zpool]
label  = "ZFS Pools"
class  = probe-zfs
script = zpool
order  = 32

[probe-zfs]
label  = "ZFS Filesystems"
class  = probe-zfs
script = zfs
order  = 33

[probe-zfs_snaps]
label  = "ZFS Snapshots"
class  = probe-zfs
script = zfs_snaps
order  = 34

[probe-svcs_x]
label  = "Service-Problems"
class  = probe-svcs
script = svcs_x
order  = 40

[probe-svcs]
label  = "Services"
class  = probe-svcs
script = svcs
order  = 41

[probe-prstat]
label  = "Top CPU Processes (prstat)"
class  = probe-ps
script = prstat
order  = 50

[probe-top]
label  = "Top CPU Processes (top)"
class  = probe-ps
script = top
order  = 51

[probe-ps]
label  = "Processes"
class  = probe-ps
script = ps
order  = 52

[probe-dmesg]
label  = "Kernel Ring Buffer (dmesg)"
class  = probe-logs
script = dmesg
order  = 60

[probe-adm_msgs]
label  = "Messages (/var/adm/messages)"
class  = probe-logs
script = adm_msgs
order  = 61
confirm = "Display?"

[probe-cpu_freq]
label  = "CPU Current Frequency"
class  = probe-cpu
script = cpu_freq
order  = 12

[probe-cpu_supported_freq]
label  = "CPU Supported Frequencies"
class  = probe-hw
script = cpu_supported_freq
order  = 70

[probe-prtdiag]
label  = "System Configuration & Diagnostic Information (prtdiag)"
class  = probe-hw
script = prtdiag
order  = 71

[probe-smart_health]
label  = "S.M.A.R.T Health"
class  = probe-smart
cmd    = smartctl_health
order  = 81

[probe-smart_temp]
label  = "S.M.A.R.T Temperature"
class  = probe-smart
cmd    = smartctl_temp
order  = 82

[probe-smart_attr]
label  = "S.M.A.R.T Attributes"
class  = probe-smart
cmd    = smartctl_attr
order  = 83

[probe-smart_all]
label  = "S.M.A.R.T Information"
class  = probe-smart
cmd    = smartctl_all
order  = 84
confirm = "Display?"

[probe-smart_devinfo]
label  = "Device Information"
class  = probe-smart
cmd    = smartctl_info
order  = 85
confirm = "Display?"

[probe-smart_test_res]
label  = "S.M.A.R.T. Self-Test Results"
class  = probe-smart
cmd    = smartctl_test_res
order  = 91
confirm = "Display?"

[probe-smart_test_short]
label  = "S.M.A.R.T. Short Self-Test"
class  = probe-smart
cmd    = smartctl_test_short
order  = 92
confirm = "Perform a short Self-Test?"

[probe-smart_test_long]
label  = "S.M.A.R.T. Long Self-Test"
class  = probe-smart
cmd    = smartctl_test_long
order  = 93
confirm = "Perform a LONG Self-Test?"