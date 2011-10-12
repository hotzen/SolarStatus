/*
 * nicstat - print network traffic, Kb/s read and written. Solaris 8+.
 *	"netstat -i" only gives a packet count, this program gives Kbytes.
 *
 * 25-Jul-2006, ver 0.92  (check for new versions, http://www.brendangregg.com)
 *
 * COMPILE:
 * 	cc -lgen -lkstat -lrt -o nicstat nicstat.c
 *
 * USAGE: nicstat [-hsz] [-i int[,int...]] | [interval [count]]
 *
 *          -h              # help
 *          -i interface    # track interface only
 *          -s              # summary output
 *          -z              # skip zero value lines
 *     eg,
 *        nicstat           # print summary since boot only
 *        nicstat 1         # print every 1 second
 *        nicstat 1 5       # print 5 times only
 *        nicstat -z 1      # print every 1 second, skip zero lines
 *        nicstat -i hme0 1 # print hme0 only every 1 second
 *
 * This prints out the Kb/s transferred for all the network cards (NICs),
 *  including packet counts and average sizes. The first line is the historic
 *  data since boot.
 *
 * FIELDS:
 *		Int	Interface
 *		rKb/s	read Kbytes/s
 *		wKb/s	write Kbytes/s
 *		rPk/s	read Packets/s
 *		wPk/s	write Packets/s
 *		rAvs	read Average size, bytes
 *		wAvs	write Average size, bytes
 *		%Util	%Utilisation (r+w/ifspeed)
 *		Sat	Saturation (defer, nocanput, norecvbuf, noxmtbuf)
 *
 * NOTE: Some unusual network cards may not provide all the details to KStat,
 *  (or provide different symbols). Check for newer versions of this program,
 *  and the g_network array in the code below.
 *
 * Utilisation is based on bytes transferred divided by speed of the interface.
 *  It should be impossible to reach 100% as there are overheads due to bus
 *  negotiation and timing.
 *
 * Saturation is determined by counting read and write errors caused by the
 *  interface running at saturation. This approach is not ideal, and the value
 *  reported is often lower than it should be (eg, 0.0). Reading the rKb/s and
 *  wKb/s fields may be more useful.
 *
 *
 * SEE ALSO:
 *	nicstat					# the Perl version
 *	kstat -n hme0 [interval [count]]	# or qfe0, ...
 *	netstat -iI hme0 [interval [count]]
 *	se netstat.se [interval]		# SE Toolkit
 *	se nx.se [interval]			# SE Toolkit
 *
 * Standard Disclaimer: This is freeware, use at your own risk.
 *
 * COPYRIGHT: Copyright (c) 2005 Brendan Gregg.
 *
 * AUTHOR: Brendan Gregg  [Sydney, Australia].
 *
 * HISTORY:
 *	07-Jan-2005	Brendan Gregg	Created this, based on perl version
 *	07-Jan-2005	   "      "	added summary style (Peter Tribble)
 *	03-Jun-2005	Tim.Cook@sun.com   modified "nocanput" lookup for ce
 *	25-Jul-2006	Tim.Cook@sun.com   use nanosleep(3),gethrtime(3) for
 *				accurate period; use fflush(stdout)
 */

#include <stdio.h>
#include <stdlib.h>
#include <strings.h>
#include <unistd.h>
#include <kstat.h>
#include <time.h>
#include <sys/time.h>
#include <libgen.h>

#define	PAGESIZE 20
#define	INTERVAL 1
#define	LOOP_MAX 1
#define	NIC_NAME_MAX 64
#define	NIC_COUNT_MAX 256

/* nicdata - useful kstat NIC data */
typedef char nicname[NIC_NAME_MAX];
typedef struct nicdata {
	nicname name;			/* name of interface */
	uint64_t rbytes;		/* total read bytes */
	uint64_t wbytes;		/* total written bytes */
	uint64_t rpackets;		/* total read packets */
	uint64_t wpackets;		/* total written packets */
	uint64_t speed;			/* speed of interface */
	uint64_t sat;			/* saturation value */
	time_t time;			/* time of sample */
} nicdata;


/*
 * Global variables
 */
static char *g_network[] = { "be", "bge", "ce", "ci", "dmfe", "e1000g", "el",
	"eri", "elxl", "fa", "ge", "hme", "ipge", "ipdptp", "iprb", "lane",
	"le", "nf", "ppp", "qe", "qfe", "rtls", "sppp", "vge", NULL };

static nicdata g_idnew[NIC_COUNT_MAX];	/* Interface Data, new */
static nicdata g_idold[NIC_COUNT_MAX];	/* Interface Data, old */
static int g_interfacemax;		/* number of found NICs */
static int g_style;			/* output style */
static int g_skipzero;			/* skip zero value lines */
static int g_someints;			/* trace some interfaces only */
static int g_forever;			/* run forever */
static char *g_tracked[NIC_COUNT_MAX];	/* Tracked interfaces */


/*
 * die - print stderr message and exit.
 *
 * This subroutine prints an error message and exits with a non-zero
 * exit status.
 */
static void
die(char *message, int status)
{
	(void) fprintf(stderr, "%s\n", message);
	exit(status);
}

/*
 * usage - print a usage message and exit.
 */
static void
usage(void)
{
	(void) fprintf(stderr,
	    "USAGE: nicstat [-hsz] [-i int[,int...]] | [interval [count]]\n"
	    "\n"
	    "         -h              # help\n"
	    "         -i interface    # track interface only\n"
	    "         -s              # summary output\n"
	    "         -z              # skip zero value lines\n"
	    "    eg,\n");
	(void) fprintf(stderr,
	    "       nicstat           # print summary since boot only\n"
	    "       nicstat 1         # print every 1 second\n"
	    "       nicstat 1 5       # print 5 times only\n"
	    "       nicstat -z 1      # print every 1 second, skip zero lines\n"
	    "       nicstat -i hme0 1 # print hme0 only every 1 second\n");
	exit(1);
}

/*
 * fetch64 - return a uint64_t value from kstat.
 *
 * The arguments are a kstat pointer, the value name,
 * and a default value in case the lookup fails.
 */
static uint64_t
fetch64(kstat_t *ksp, char *value64, uint64_t def)
{
	kstat_named_t *knp;	/* Kstat named pointer */

	/* try a lookup and return */
	if ((knp = kstat_data_lookup(ksp, value64)) != NULL)
		return (knp->value.ui64);
	return (def);
}

/*
 * fetch32 - return a uint32_t value from kstat.
 *
 * The arguments are a kstat pointer, the value name,
 * and a default value in case the lookup fails.
 */
static uint32_t
fetch32(kstat_t *ksp, char *value, uint32_t def)
{
	kstat_named_t *knp;	/* Kstat named pointer */

	/* try a lookup and return */
	if ((knp = kstat_data_lookup(ksp, value)) != NULL)
		return (knp->value.ui32);
	return (def);
}

/*
 * fetch6432 - return a uint64_t or a uint32_t value from kstat.
 *
 * The arguments are a kstat pointer, a potential ui64 value name,
 * a potential ui32 value name, and a default value in case both
 * lookup fails. The ui64 value is attempted first.
 */
static uint64_t
fetch6432(kstat_t *ksp, char *value64, char *value, uint64_t def)
{
	kstat_named_t *knp;	/* Kstat named pointer */

	/* try lookups and return */
	if ((knp = kstat_data_lookup(ksp, value64)) != NULL)
		return (knp->value.ui64);
	if ((knp = kstat_data_lookup(ksp, value)) != NULL)
		return (knp->value.ui32);
	return (def);
}

/*
 * fetch_nocanput - return nocanput value, whose name(s) are driver-dependent.
 *
 * Most drivers have a kstat "nocanput", but the ce driver
 * at least has "rx_nocanput" and "tx_nocanput"
 */
static uint32_t
fetch_nocanput(kstat_t *ksp, uint32_t def)
{
	kstat_named_t *knp;	/* Kstat named pointer */
	uint32_t sum;

	/* Check "nocanput" first */
	if ((knp = kstat_data_lookup(ksp, "nocanput")) != NULL) {
		return (knp->value.ui32);
	} else {
		if ((knp = kstat_data_lookup(ksp, "rx_nocanput")) != NULL) {
			sum = knp->value.ui32;
			if ((knp = kstat_data_lookup(ksp, "tx_nocanput"))
			    != NULL) {
				sum += knp->value.ui32;
				return (sum);
			}
		}
	}
	return (def);
}

/*
 * fetch_boot_time - return the boot time in secs.
 *
 * This takes a kstat control pointer and looks up the boot time
 * from unix:0:system_misc:boot:time. If found, this is returned,
 * else 0.
 */
static time_t
fetch_boot_time(kstat_ctl_t *kc)
{
	kstat_t *ksp;		/* Kstat struct pointer */
	kstat_named_t *knp;	/* Kstat named pointer */

	if ((ksp = kstat_lookup(kc, "unix", 0, "system_misc")) == NULL)
		die("ERROR2: Can't read boot_time.\n", 2);
	if ((kstat_read(kc, ksp, NULL) != -1) &&
	    ((knp = kstat_data_lookup(ksp, "boot_time")) != NULL)) {
		/* summary since boot */
		return (knp->value.ui32);
	} else {
		/* summary since, erm, epoch */
		return (0);
	}
}

/*
 * populate_g_idnew - the master kstat function.
 *
 * This fetches all the network data from kstat and populates the
 * global variables g_idnew and g_interfacemax. It uses a kstat control
 * pointer as an argument, and the global array g_network.
 *
 * This function works by climbing down the kstat chains looking
 * for modules that look like network interfaces. The first step is
 * to check the module name against the global array g_network (the code
 * for this will need maintenance as new network cards are developed);
 * then a kstat variable is checked "obytes" or "obytes64" to ensure
 * that this really is a network module. This approach is not ideal,
 * I'd rather base the test on the kstat class == "net", however this
 * data does not yet appear reliable across all interfaces.
 */
static void
populate_g_idnew(kstat_ctl_t *kc)
{
	kstat_t *ksp;		/* Kstat struct pointer */
	int ok, i;
	int num = 0;

	for (ksp = kc->kc_chain; ksp != NULL; ksp = ksp->ks_next) {

		/* Search all modules */
		for (ok = 0, i = 0; g_network[i] != NULL; i++) {
			if (strcmp(ksp->ks_module, g_network[i]) == 0)
				ok = 1;
		}

		/* Skip if this isn't a network module */
		if (ok == 0) continue;
		if (kstat_read(kc, ksp, NULL) == -1) continue;
		if ((kstat_data_lookup(ksp, "obytes") == NULL) &&
		    (kstat_data_lookup(ksp, "obytes64") == NULL)) continue;

		/* Check for tracked interfaces */
		if (g_someints) {
			for (ok = 0, i = 0; *g_tracked[i] != NULL; i++) {
				if (strcmp(ksp->ks_name, g_tracked[i]) == 0)
					ok = 1;
			}
			if (ok == 0) continue;
		}

		/* Save network values */
		g_idnew[num].rbytes = fetch6432(ksp, "rbytes64", "rbytes", 0);
		g_idnew[num].wbytes = fetch6432(ksp, "obytes64", "obytes", 0);
		g_idnew[num].rpackets =
		    fetch6432(ksp, "ipackets64", "ipackets", 0);
		g_idnew[num].wpackets =
		    fetch6432(ksp, "opackets64", "opackets", 0);
		g_idnew[num].sat = fetch32(ksp, "defer", 0);
		g_idnew[num].sat += fetch_nocanput(ksp, 0);
		g_idnew[num].sat += fetch32(ksp, "norcvbuf", 0);
		g_idnew[num].sat += fetch32(ksp, "noxmtbuf", 0);
		g_idnew[num].time = time(0);
		/* if the speed can't be fetched, this makes %util 0.0 */
		g_idnew[num].speed = fetch64(ksp, "ifspeed", 1LL << 48);
		(void) strcpy(g_idnew[num].name, ksp->ks_name);

		num++;
	}
	g_interfacemax = num - 1;
}

/*
 * print_header - print the header line.
 */
static void
print_header(void)
{
	if (g_style)
		(void) printf("%8s %5s %14s %14s\n",
		    "Time", "Int", "rKb/s", "wKb/s");
	else
		(void) printf(
		    "%8s %5s %7s %7s %7s %7s %7s %7s %7s %7s\n",
		    "Time", "Int", "rKb/s", "wKb/s", "rPk/s",
		    "wPk/s", "rAvs", "wAvs", "%Util", "Sat");
}


/*
 * Main Program
 */
int main(int argc, char *argv[]) {
	/*
	 * Variable Declaration
	 */
	kstat_ctl_t *kc;	/* Kstat controller */
	double rbps;		/* read bytes per sec */
	double wbps;		/* write bytes per sec */
	double rkps;		/* read Kb per sec */
	double wkps;		/* write Kb per sec */
	double rpps;		/* read packets per sec */
	double wpps;		/* write packets per sec */
	double ravs;		/* read average packet size */
	double wavs;		/* write average packet size */
	double sats;		/* saturation value per sec */
	double tdiff;		/* time difference between samples */
	double util;		/* utilisation */
	struct tm *times;	/* time struct */
	char timestr[16];	/* time string */
	time_t boot_time;	/* boot time */
	int num;		/* NIC counter */
	int interval;		/* interval, secs */
	int loop_max;		/* max output lines */
	int loop;		/* current loop number */
	int line;		/* output line counter */
	int option;		/* command line switch */
	hrtime_t period_n;	/* period of each iteration in nanoseconds */
	hrtime_t start_n;	/* start point of an iteration, nsec */
	hrtime_t end_n;		/* end time of work in an iteration, nsec */
	hrtime_t pause_n;	/* time until start of next iteration, nsec */
	struct timespec pause_tv;
				/* time until start of next iteration */

	/* defaults */
	interval = INTERVAL;
	loop_max = LOOP_MAX;
	line = PAGESIZE;
	loop = 0;
	g_style = 0;
	g_skipzero = 0;
	g_someints = 0;
	g_forever = 0;
	for (num = 0; num <= g_interfacemax; num++) {
		g_idold[num].rbytes = 0;
		g_idold[num].wbytes = 0;
		g_idold[num].rpackets = 0;
		g_idold[num].wpackets = 0;
		g_idold[num].sat = 0;
	}

	/*
	 * Process arguments
	 */
	while ((option = getopt(argc, argv, "hi:sz")) != -1) {
		switch (option) {
			case 'h':
				usage();
				break;
			case 'i':
				g_someints = 1;
				(void) bufsplit(",", 0, (char **)0);
				(void) bufsplit(optarg, NIC_COUNT_MAX,
				    g_tracked);
				break;
			case 's':
				g_style = 1;
				break;
			case 'z':
				g_skipzero = 1;
				break;
			default:
				usage();
		}
	}
	argv += optind;
	if ((argc - optind) >= 1) {
		interval = atoi(*argv);
		if (interval == 0)
			usage();
		argv++;
		if ((argc - optind) >= 2)
			loop_max = atoi(*argv);
		else
			g_forever = 1;
	}

	/* Open Kstat */
	if ((kc = kstat_open()) == NULL)
		die("ERROR3: Can't open /dev/kstat.\n", 3);

	/* Fetch boot time */
	boot_time = fetch_boot_time(kc);
	for (num = 0; num <= g_interfacemax; num++)
		g_idold[num].time = boot_time;

	/* Calculate the period of each iteration */
	period_n = (hrtime_t) interval * NANOSEC;

	/* Get time when we started */
	start_n = gethrtime();

	/*
	 * Main Loop
	 */
	for (;;)
	{
		/* Print header line */
		if (line >= PAGESIZE) {
			line = 0;
			print_header();
		}

		/*
		 * Fetch Data
		 */
		populate_g_idnew(kc);

		/* Check we matched some NICs */
		if (g_interfacemax == -1)
			die("ERROR4: No such interface found.", 4);

		/*
		 * Calculate and Print Data
		 */
		for (num = 0; num <= g_interfacemax; num++) {
			/* Calculate time difference */
			tdiff = g_idnew[num].time - g_idold[num].time;
			if (tdiff == 0) tdiff = 1;

			/* Calculate per second values */
			rbps = (g_idnew[num].rbytes - g_idold[num].rbytes)
			    / tdiff;
			wbps = (g_idnew[num].wbytes - g_idold[num].wbytes)
			    / tdiff;
			rpps = (g_idnew[num].rpackets - g_idold[num].rpackets)
			    / tdiff;
			wpps = (g_idnew[num].wpackets - g_idold[num].wpackets)
			    / tdiff;
			sats = (g_idnew[num].sat - g_idold[num].sat) / tdiff;
			rkps = rbps / 1024;
			wkps = wbps / 1024;
			if (rpps > 0) ravs = rbps / rpps; else ravs = 0;
			if (wpps > 0) wavs = wbps / wpps; else wavs = 0;

			/* Calculate utilisation */
			if (g_idnew[num].speed > 0) {
				/*
				 * the following has a mysterious "800", it is
				 * 100 for the % conversion, and 8 for
				 * bytes2bits.
				 */
				util = (rbps + wbps) * 800 / g_idnew[num].speed;
				if (util > 100) util = 100;
			} else
				util = 0;

			/* always print header if there are multiple NICs */
			if (g_interfacemax > 0)
				line += PAGESIZE;
			else
				line++;

			/* Skip zero lines */
			if (g_skipzero && (util == 0)) continue;

			/* Fetch time */
			times = localtime(&g_idnew[num].time);
			(void) strftime(timestr, sizeof (timestr),
			    "%H:%M:%S", times);

			/* Print output line */
			(void) printf("%s %5s ", timestr, g_idnew[num].name);
			if (g_style)
				(void) printf("%14.3f %14.3f\n", rkps, wkps);
			else
				(void) printf(
				    "%7.2f %7.2f %7.2f %7.2f "
				    "%7.2f %7.2f %7.2f %7.2f\n",
				    rkps, wkps, rpps, wpps, ravs, wavs,
				    util, sats);

			g_idold[num] = g_idnew[num];
		}

		/* end point */
		if (!g_forever)
			if (++loop == loop_max) break;

		/* flush output */
		if (fflush(stdout) != 0)
			die("ERROR5: fflush(stdout) failed\n", 5);

		/* have a kip */
		end_n = gethrtime();
		pause_n = start_n + period_n - end_n;
		if (pause_n > 0) {
			pause_tv.tv_sec = pause_n / NANOSEC;
			pause_tv.tv_nsec = pause_n % NANOSEC;
			(void) nanosleep(&pause_tv, (struct timespec *) NULL);
		}
		start_n += period_n;
	}

	/*
	 * Close Kstat
	 */
	(void) kstat_close(kc);
	return (0);
}
