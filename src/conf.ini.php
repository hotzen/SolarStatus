; <?php exit; ?>
dir_scripts = ./scripts

;##############################################################################
; AUTHENTICATION - comment out to disable
[auth]
password = f00bar

; session-timeout in seconds (default: 900seconds / 15 minutes)
timeout = 900


;##############################################################################
; FILTERS, that control which probes (actually HTML-Elements) are displayed.
;          The filter's number donates its order in the sequence of filters
;
; the following directives can be used:
;   label      The label of the filter, required
;   selector   CSS-selector, separate multiple selectors with comma (,)
;   default    Use the filter by default, optional

[filter-1]
label    = "CPU, I/O, TOP"
selector = "#mpstat, #zpool_iostat, #nicstat, #top"

[filter-2]
label    = "Health"
selector = "#zpool_status, #svcs_x, #smart_health"

[filter-10]
label    = "CPU"
selector = ".probe-cpu"

[filter-20]
label    = "I/O"
selector = ".probe-io"

[filter-30]
label    = "ZFS"
selector = ".probe-zfs"

[filter-31]
label    = "ZFS Adv."
selector = ".probe-zfs-adv"

[filter-40]
label    = "Processes"
selector = ".probe-ps"

[filter-50]
label    = "Services"
selector = ".probe-svcs"

[filter-60]
label    = "Network"
selector = ".probe-network"

[filter-70]
label    = "Logs"
selector = ".probe-logs"

[filter-80]
label    = "System / Hardware"
selector = ".probe-sys"

[filter-90]
label    = "S.M.A.R.T."
selector = ".probe-smart"

[filter-999]
label    = "All"
selector = ".probe"


;##############################################################################
; MACROS, their uppercased name can be used in CMD-directives in commands
;         where they get expanded
;         example:
;           [macros]
;           smartctl = "/path/to/smartctl"
;           [probe-foo]
;           cmd = "%SMARTCTL --foo --bar"
[macros]

; http://smartmontools.sourceforge.net/man/smartctl.8.html
; smartmon requires raw disk access via /dev/rdsk/
;
; smartmon requires root-privileges!
; create a file /etc/sudoers.d/smartctl or line into /etc/sudoers:
;   webservd ALL=NOPASSWD:/path/to/smartctl
; this allows webservd-user to execute smartcl without password-auth using root-privileges
smartctl = "sudo /path/to/smartctl"



;##############################################################################
; DEVICE-SETS, where each set contains N devices.
; A device-set can be used in commands by using the macro %DEVSET-<NUM> which gets expanded to the set's devices.
;
; A command using a device-sets with N devices, is expanded into N individual commands,
; each using one device of the device-set.
; So a command using a device-set with 3 devices is expanded to 3 individual commands with 3 different results.
;
; Example: If %DEVSET-11 contains 3 devices, a command using this devset is expanded to 3 individual commands,
; 		   where each command uses one of those 3 devices
;		   Directive:	[devset-11]
;						dev[] = <dev-1>
;						dev[] = <dev-2>
;						dev[] = <dev-3>
;		   Command:		echo %DEVSET-11
;		   Expanded:	echo <dev-1>, echo <dev-2>, echo <dev-3>
;						(3 independent commands are executed in sequence)


;*****************************
; device-set #0: OS
[devset-0]
dev[] = /dev/rdsk/c8t0d0s0


;*****************************
; device-set #1: Storage
[devset-1]
dev[] = /dev/rdsk/c8t1d0
dev[] = /dev/rdsk/c8t2d0
dev[] = /dev/rdsk/c8t3d0



;##############################################################################
; PROBES, each probe is a listing that displays either
;         the output of a script or of an configured command
;
; the following directives can be used:
;  label	The label of the probe, required
;  class	Arbitrary CSS-classes, primarily used for filtering the probes by above filters, recommended
;  cmd      EITHER a command to get executed, macros defined in [macros] are automatically expanded
;  script   OR name of a script in the scripts-directory
;  order    An integer to determine the order in which the probes are displayed, optional
;  confirm  Probe is not auto refreshed, but explicitly by user-confirmation (e.g. SMART self-tests)


;*****************************
;* CPU

[probe-vmstat]
label  = "CPU (vmstat)"
class  = probe-cpu
cmd    = "vmstat 1 2"
order  = 10

[probe-mpstat]
label  = "CPU-Cores (mpstat)"
class  = probe-cpu
cmd    = "mpstat 1 2"
order  = 11


;*****************************
;* I/O

[probe-iostat]
label  = "I/O"
class  = probe-io
cmd    = "iostat -dnx 1 2"
order  = 20

[probe-zpool_iostat]
label  = "ZFS I/O"
class  = "probe-zfs probe-io"
cmd    = "zpool iostat -v 1 2"
order  = 21

; http://www.brendangregg.com/Perf/network.html#nicstat
[probe-nicstat]
label  = "NICstat"
class  = probe-io
cmd    = "/usr/sbin/nicstat 1 2"
order  = 22


;******************************
;* ZFS

[probe-zpool_status]
label  = "ZFS Status"
class  = probe-zfs
cmd    = "zpool status -x"
order  = 31

[probe-zpool]
label  = "ZFS Pools"
class  = probe-zfs
cmd    = "zpool status -v"
order  = 32

[probe-zfs]
label  = "ZFS Filesystems"
class  = probe-zfs
cmd    = "zfs list -t fs -o name,used,avail,mountpoint,sharesmb,sharenfs,keystatus"
order  = 33

[probe-zfs_snaps]
label  = "ZFS Snapshots"
class  = probe-zfs
cmd    = "zfs list -t snapshot"
order  = 34

; https://github.com/mharsch/arcstat
; http://hardforum.com/showpost.php?p=1037874802&postcount=22
[probe-zfs_arc_stat]
label  = "ZFS ARC Stat"
class  = probe-zfs-adv
cmd    = "/opt/arcstat.pl -f read,hits,miss,hit%,l2read,l2hits,l2miss,l2hit%,arcsz,l2size 1 3"
order  = 35

; http://cuddletech.com/arc_summary/
; Thanks to ChrisBenn http://hardforum.com/showpost.php?p=1037874906&postcount=23
[probe-zfs_arc_summary]
label  = "ZFS ARC Summary"
class  = probe-zfs-adv
cmd    = "/opt/arc_summary.pl"
order  = 36

; http://www.richardelling.com/Home/scripts-and-programs-1/zilstat
; DTrace requires additional privileges, so use:
; usermod -K defaultpriv=basic,dtrace_user,dtrace_proc,dtrace_kernel webservd
; to give webservd full read-only kernel-access
; Thanks to ChrisBenn http://hardforum.com/showpost.php?p=1037874906&postcount=23
;[probe-zfs_zil_stat]
;label  = "ZFS ZIL Stat"
;class  = probe-zfs-adv
;cmd    = "/opt/zilstat.ksh -M -t 1 3"
;order  = 37


;*****************************
;* Services

[probe-svcs_x]
label  = "Service-Problems"
class  = probe-svcs
cmd    = "svcs -x"
order  = 40

[probe-svcs]
label  = "Services"
class  = probe-svcs
;cmd    = "svcs -a -o state,stime,fmri"
cmd    = "svcs"
order  = 41


;*****************************
;* Network

[probe-dladm_link]
label  = "Links"
class  = probe-network
cmd    = "dladm show-link"
order  = 42

[probe-ipadm_if]
label  = "Interfaces"
class  = probe-network
cmd    = "ipadm show-if"
order  = 43

[probe-ipadm_addr]
label  = "Addresses"
class  = probe-network
cmd    = "ipadm show-addr"
order  = 44

[probe-hosts]
label  = "Hosts"
class  = probe-network
cmd    = "cat /etc/hosts | egrep -v '^#'"
order  = 45

[probe-shares]
label  = "Shares"
class  = probe-network
cmd    = "sharemgr show -p"
order  = 46


;*****************************
;* Processes

[probe-prstat]
label  = "Top CPU Processes (prstat)"
class  = probe-ps
cmd    = "prstat -a -n 10 -s cpu 1 1"
order  = 50

[probe-top]
label  = "Top CPU Processes (CPU-Load now)"
class  = probe-ps
cmd    = "top --batch --full-commands --quick --displays 1 10"
order  = 51

[probe-top_time]
label  = "Top CPU Processes (Most CPU-Time)"
class  = probe-ps
cmd    = "top --batch --full-commands --quick --displays 1 10 --sort-order time"
order  = 51

[probe-ps]
label  = "Processes"
class  = probe-ps
cmd    = "ps -e -o pid -o user -o s -o pcpu -o pmem -o vsz  -o stime -o comm"
order  = 53


;*****************************
;* Logs

[probe-dmesg]
label  = "Kernel Ring Buffer (dmesg)"
class  = probe-logs
cmd    = "dmesg"
order  = 60

[probe-adm_msgs]
label  = "Messages (/var/adm/messages)"
class  = probe-logs
cmd    = "cat /var/adm/messages"
order  = 61
confirm = "Display?"


;*****************************
;* System / Hardware

[probe-uname]
label  = "System Information"
class  = probe-sys
cmd    = "/usr/gnu/bin/uname --all"
order  = 70

[probe-psrinfo]
label  = "Processor"
class  = probe-sys
cmd    = "psrinfo -p -v"
order  = 71

[probe-cpu_freq]
label  = "CPU Current Frequency"
class  = probe-cpu probe-sys
cmd    = "kstat -p -m cpu_info -i 0 -s current_clock_Hz"
order  = 72

[probe-cpu_supported_freq]
label  = "CPU Supported Frequencies"
class  = probe-sys
cmd    = "kstat -p -m cpu_info -s supported_frequencies_Hz"
order  = 73

[probe-prtdiag]
label  = "System Configuration & Diagnostic Information (prtdiag)"
class  = probe-sys
cmd    = "prtdiag -v"
order  = 74

[probe-intrstat]
label  = "Interrupt Statistics"
class  = probe-sys
cmd    = "intrstat 1 2"
order  = 75


;*****************************
;* SMART
[probe-smart_idle]
label   = "HDD Sleep/SpinDown-Check"
class   = probe-smart
cmd     = "%SMARTCTL --nocheck=sleep --health -d sat,12 %DEVSET-1"
order   = 80

[probe-smart_spindown]
label   = "HDD Spindown"
class   = probe-smart
cmd     = "%SMARTCTL --set=standby,now -d sat,12 %DEVSET-1"
order   = 81
confirm = "This SMART command will spindown your drives!"

[probe-smart_health]
label   = "HDD Health"
class   = probe-smart
cmd     = "%SMARTCTL --health -d sat,12 %DEVSET-1"
order   = 82
confirm = "SMART commands will wake-up your disks!"

[probe-smart_temp]
label   = "HDD Temperature"
class   = probe-smart
cmd     = "%SMARTCTL --attributes -d sat,12 %DEVSET-1 | grep -i temperature"
order   = 83
confirm = "SMART commands will wake-up your disks!"

[probe-smart_attr]
label   = "HDD SMART Attributes (<a href='http://sourceforge.net/apps/trac/smartmontools/wiki/Howto_ReadSmartctlReports_ATA' target='_blank'>HowTo</a>)"
class   = probe-smart
cmd     = "%SMARTCTL --attributes -d sat,12 %DEVSET-1"
order   = 84
confirm = "SMART commands will wake-up your disks!"

[probe-smart_all]
label   = "HDD SMART Complete Information"
class   = probe-smart
cmd     = "%SMARTCTL --all -d sat,12 %DEVSET-1"
order   = 85
confirm = "SMART commands will wake-up your disks!"

[probe-smart_devinfo]
label   = "HDD Device Information"
class   = probe-smart
cmd     = "%SMARTCTL --info -d sat,12 %DEVSET-1"
order   = 86
confirm = "SMART commands will wake-up your disks!"

[probe-iostat_errors]
label   = "IOStat Error Summary"
class   = probe-smart
cmd     = "iostat -En"
order   = 87

[probe-smart_test_results]
label   = "SMART Self-Test Results"
class   = probe-smart
cmd     = "%SMARTCTL --log=selftest -d sat,12 %DEVSET-1"
order   = 91
confirm = "SMART commands will wake-up your disks!"

[probe-smart_test_short]
label   = "SMART Perform Short Self-Test"
class   = probe-smart
cmd     = "%SMARTCTL --test=short -d sat,12 %DEVSET-1"
order   = 92
confirm = "SMART commands will wake-up your disks!\nPerform a short Self-Test?"

[probe-smart_test_long]
label   = "SMART Perform Long Self-Test"
class   = probe-smart
cmd     = "%SMARTCTL --test=long -d sat,12 %DEVSET-1"
order   = 93
confirm = "SMART commands will wake-up your disks!\nPerform a LONG Self-Test?"
confirm = "SMART commands will wake-up your disks!\nPerform a LONG Self-Test?"