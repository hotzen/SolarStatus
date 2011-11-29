/*
load averages:  0.02,  0.02,  0.01;               up 68+15:33:04       13:01:07
65 processes: 62 sleeping, 1 zombie, 1 stopped, 1 on cpu
CPU states: 87.5% idle, 12.1% user,  0.4% kernel,  0.0% iowait,  0.0% swap
Kernel: 323 ctxsw, 292 trap, 495 intr, 894 syscall, 263 flt
Memory: 4094M phys mem, 406M free mem, 2047M total swap, 2047M free swap

   PID USERNAME NLWP PRI NICE  SIZE   RES STATE    TIME    CPU COMMAND
 15411 webservd    1  52    0 3800K 1740K cpu/1    0:00 11.92% top --batch --full-commands --quick --displays 1 10
 15412 webservd    1  59    0   11M 2688K sleep    0:00  0.38% zpool iostat 1 2
 13690 webservd    1  59    0   17M 5028K sleep    0:01  0.21% /usr/php/bin/php-cgi
  1273 webservd    1  59    0   11M 5368K sleep   17:30  0.05% perl /opt/arcstat.pl
  1296 webservd    1  59    0   11M 5368K sleep   17:23  0.05% perl /opt/arcstat.pl
 13892 webservd    1  59    0 6480K 4472K sleep    1:28  0.01% /usr/lighttpd/1.4/sbin/lighttpd -f /etc/lighttpd/lighttpd.conf
 13985 root        1  59    0 5888K 2864K sleep    2:02  0.00% /usr/lib/inet/ntpd -p /var/run/ntp.pid -g
   359 root       31  59    0   12M 4580K sleep    1:45  0.00% /usr/sbin/nscd
   429 root        6  59    0   10M 3528K sleep    0:56  0.00% devfsadmd
   490 root       17  59    0   15M   10M sleep    3:21  0.00% /usr/lib/smbsrv/smbd start
*/
function solar_overview_top(rows) {
	var res = []	
	
	for (var i=7; i<rows.length; i++) { // skip first 7 lines
		var row = rows[i]
		var cols = row.splitBlanks()
		
		var ps = cols.slice(10).join(" ")
		var cpuTime = cols[8]
		var cpuLoad = cols[9]
		
		$view = $("<span></span>")
		$view.append( $("<input type=\"text\"></input>").val(ps) )
		$view.append( $("<span></span>").addClass("cpu-load").text(cpuLoad) )
		$view.append( $("<span>(CPU-Time: </span>") )
		$view.append( $("<span></span>").addClass("cpu-time").text(cpuTime) )
		$view.append( $("<span> mins)</span>") )
		
		res.push( ["Top Process", $view] )
		break;
	}
	
	return res
}