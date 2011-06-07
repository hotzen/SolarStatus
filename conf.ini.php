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
; smartmon requires raw disk access via /dev/rdsk/
; if "zpool status" lists the disk cXtYdZ, the valid smartmon device-path is /dev/rdsk/cXtYdZp0 (note the p0 to denote the "whole" disk)
smartctl   = /opt/smartmon/sbin/smartctl


;################################################
; authentication - comment out to disable
[auth]
password = f00bar
secret   = 9d9c8a3fb07ccb2c7a56d2f89b2dee6f


;################################################
; device-sets, where each set contains N devices.
; A device-set can be used in commands by using the macro %DEVSET-<NUM> which is expanded to its devices.
; If %DEVSET-X contains 3 devices, a command using this devset is expanded to 3 individual commands, where each command uses one of those 3 devices

; device-set #0: SSD/OS
[devset-0]
dev[] = /dev/rdsk/c8t0d0s0

; device-set #1: HDD/Storage
[devset-1]
dev[] = /dev/rdsk/c8t1d0p0
dev[] = /dev/rdsk/c8t2d0p0
dev[] = /dev/rdsk/c8t3d0p0

;################################################
; COMMANS, where each command may use the folling variables/macros:
; 	%DEVSET-<ID>   a set of devices, configured above
; 	%SMARTCTL	   the path to smartctl, if configured above
;	%NICSTAT	   the path to nicstat, if configured above
;
; each command-section begins with "command-", followed by the command's id

[command-smartctl_info]
label   = "Device-Information"
command = "%SMARTCTL --info -d sat %DEVSET-1"

[command-smartctl_all]
label   = "S.M.A.R.T. data"
command = "%SMARTCTL --all -d sat %DEVSET-1"



;################################################
; FILTERS, that control which probes are displayed.
;          The filter's number donates its order in the sequence of filters
;
; 0  => first filter, by default the predefined filters "None" = 0 and "All" = 1
; 10 => 10th filter
; 99 => 99th filter, probably the last filter
;
; the following directives must be used:
;   label      The label of the filter
;   selector   CSS-selector, multiple selectors separated by ; are logically OR-ed
;   default    Use the filter by default

; <li><a href="#filter" title="Only show CPU" data-filter=".group-cpu">CPU</a></li>
; <li><a href="#filter" title="Only show I/O" data-filter=".group-io">I/O</a></li>
; <li><a href="#filter" title="Only show ZFS" data-filter=".group-zfs">ZFS</a></li>
; <li><a href="#filter" title="Only show Processes" data-filter=".group-ps">Processes</a></li>
; <li><a href="#filter" title="Only show Services" data-filter=".group-svcs">Services</a></li>
; <li><a href="#filter" title="Only show Logs" data-filter=".group-logs">Logs</a></li>
; <li><a href="#filter" title="Only show Hardware" data-filter=".group-hw">Hardware</a></li>


[filter-1]
label    = "Overview"
selector = "#mpstat; #zpool_iostat; #top; #cpu_freq; #nicstat"
default  = true

[filter-2]
label    = "Health"
selector = "#svcs_x; #dmesg"

[filter-10]
label    = "CPU"
selector = ".group-cpu"

[filter-20]
label    = "I/O"
selector = ".group-io"

[filter-30]
label    = "ZFS"
selector = ".group-zfs"

[filter-40]
label    = "Processes"
selector = ".group-ps"

[filter-50]
label    = "Services"
selector = ".group-svcs"

[filter-60]
label    = "Logs"
selector = ".group-logs"

[filter-70]
label    = "Hardware"
selector = ".group-hw"

[filter-80]
label    = "S.M.A.R.T."
selector = ".group-smart"

;################################################
; PROBES, each probe is a listing that displays either
;         the output of a script or of an configured command
;
; the following directives can be used:
;  label	The label of the probe
;  class	arbitrary CSS-classes, primarily used for filtering the probes
;  script   EITHER name of a script in the scripts-directory
;  cmd      OR     id of a command configured above
;  order    An integer to determine the order in which the probes are displayed

[probe-vmstat]
label  = "CPU (vmstat)"
class  = group-cpu
script = vmstat
order  = 10

[probe-mpstat]
label  = "CPU-Cores (mpstat)"
class  = group-cpu
script = mpstat
order  = 11

[probe-iostat]
label  = "I/O"
class  = group-io
script = iostat
order  = 20

[probe-zpool_iostat]
label  = "ZFS I/O"
class  = "group-zfs group-io"
script = zpool_iostat
order  = 21

[probe-nicstat]
label  = "Network-Interfaces (<a href=\"http://www.brendangregg.com/K9Toolkit/nicstat.c\">nicstat</a>)"
class  = group-io
script = iostat
order  = 22

[probe-zpool_status]
label  = "ZFS Status"
class  = group-zfs
script = zpool_status
order  = 31

[probe-zpool]
label  = "ZFS Pools"
class  = group-zfs
script = zpool
order  = 32

[probe-zfs]
label  = "ZFS Filesystems"
class  = group-zfs
script = zfs
order  = 33

[probe-svcs_x]
label  = "Service-Problems"
class  = group-svcs
script = svcs_x
order  = 40

[probe-svcs]
label  = "Services"
class  = group-svcs
script = svcs
order  = 41

[probe-prstat]
label  = "Top CPU Processes (prstat)"
class  = group-ps
script = prstat
order  = 50

[probe-top]
label  = "Top CPU Processes (top)"
class  = group-ps
script = top
order  = 51

[probe-ps]
label  = "Processes"
class  = group-ps
script = ps
order  = 52

[probe-dmesg]
label  = "Kernel Ring Buffer (dmesg)"
class  = group-logs
script = dmesg
order  = 60

[probe-adm_msgs]
label  = "Messages (/var/adm/messages)"
class  = group-logs
script = adm_msgs
order  = 61

[probe-cpu_freq]
label  = "CPU Current Frequency"
class  = group-cpu
script = cpu_freq
order  = 12

[probe-cpu_supported_freq]
label  = "CPU Supported Frequencies"
class  = "group-cpu group-hw"
script = cpu_supported_freq
order  = 70

[probe-prtdiag]
label  = "System Configuration & Diagnostic Information (prtdiag)"
class  = group-hw
script = prtdiag
order  = 71

[probe-smart_all]
label  = "S.M.A.R.T"
class  = group-smart
cmd    = smartctl_all
order  = 65

[probe-smart_devinfo]
label = "Device Information"
class = group-smart
cmd   = smartctl_info
order  = 66