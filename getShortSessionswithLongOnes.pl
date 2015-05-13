#!/usr/bin/perl
use warnings;
use strict;
use DateTime;

use constant INTERVAL => 30;

my @tobefiltered = ("doubleclick", "sharethis", "fbcdn", "disqus", "51yes", "pubmatic", "surphace", "atdmt", "outbrain", "zedo", "googlelabs", "addthis", "crwdcntrl", "nextag", "vcimg", "bluekai", "turn", "googleadservices", "rubiconproject", "afy11", "demdex", "allyes", "adosnar", "backbeatmedia");

# get short session instances out of the raw data
open my $IN, "<", "../history_2_major.txt" or
	die "Can't open input file: $!";
open my $OUT_SS, ">", "../ss.txt" or
	die "Can't open output file: $!";
open my $OUT_IDLE, ">", "../idles.txt" or
	die "Can't open output file: $!";
open my $OUT_LS, ">", "../ls.txt" or
	die "Can't open output file: $!";

my @t;		# time; (current, next, ss begins, ss ends, ls begins, ls ends)
my @d;		# domain; (current domain, THE domain)
LINE: while (<$IN>) {
	my @arr = split(/\", \"/, $_);
	$t[0] = getDTObj($arr[0]);
	#if ($arr[1] =~ /^\Q\Ehttp:\/\/www.google.com\/(#|search|url)/ or $arr[1] =~ /^\Q\Ehttp:\/\/(www|cpro).baidu.com/) {
	#	$t[1] = $t[0]; next;
	#}

	if (!defined($t[1])) { # first lopp
		$t[5] = $t[3] = $t[1] = $t[0];
	}

	my @urlarr = split(/\//, $arr[1]);
	my @dnarr = split(/\./, $urlarr[2]);
	if ($dnarr[$#dnarr] eq "cn" and $dnarr[$#dnarr-1] =~ /(com|edu|gov)/) {
		$d[0] = $dnarr[$#dnarr-2];
	} else {
		$d[0] = $dnarr[$#dnarr-1];
	}

	my $signal = 0;
	foreach (@tobefiltered) {
		if ($d[0] eq $_) {
			$signal = 1; last;
		}
	}

	my $i = ($t[1] - $t[0])->in_units('minutes');
	if ($i > INTERVAL) {
		$t[4] = $t[2] = $t[1];
		print $OUT_SS "$t[2],$t[3],$d[1]\n";
		$t[3] = $t[0];
		print $OUT_IDLE "$t[0],$t[1],$i\n";
		my $j = ($t[5] - $t[4])->in_units('minutes');
		print $OUT_LS "$t[4],$t[5],$j\n";
		$t[5] = $t[0];
	} elsif ($signal == 0 and defined($d[1]) and $d[0] ne $d[1]) {
			$t[2] = $t[1];
			print $OUT_SS "$t[2],$t[3],$d[1]\n";
			$t[3] = $t[1];
	} elsif ($signal == 1) {
		$t[1] = $t[0]; next;
	}
	$t[1] = $t[0];
	$d[1] = $d[0];
}

$t[2] = $t[1];
$t[4] = $t[1];
print $OUT_SS "$t[2],$t[3],$d[1]";
my $d = ($t[5]-$t[4])->in_units('minutes');
print $OUT_LS "$t[4],$t[5],$d";

# get a DateTime object by passing "yyyy-mm-dd hh:mm:ss"
sub getDTObj {
	my @tmp = split /"/, $_;
	my @datetime = split / /, $tmp[1];
	my @date = split /-/, $datetime[0];
	my @time = split /:/, $datetime[1];
	my $dtobj = DateTime->new(
		year	=> $date[0],
		month	=> $date[1],
		day	=> $date[2],
		hour	=> $time[0],
		minute	=> $time[1],
		second	=> $time[2],
	);
	return $dtobj;
}
