#!/usr/bin/perl
use warnings;
use strict;
use DateTime;

my @tobefiltered = ("doubleclick", "sharethis", "fbcdn", "disqus", "51yes", "pubmatic", "surphace", "atdmt", "outbrain", "zedo", "googlelabs", "addthis", "crwdcntrl", "nextag", "vcimg", "bluekai", "turn", "googleadservices", "rubiconproject", "afy11", "demdex", "allyes", "adosnar", "backbeatmedia");

# get short session instances out of the raw data
open my $IN, "<", "../history_2_major.txt" or die "Can't open input file: $!";
open my $OUT, ">", "../ss.txt" or die "Can't open output file: $!";
open my $OUT1, ">", "../test.txt" or die "Can't open output test file: $!";

my @time; # (current time, next time, session begins, session ends)
my @domain; # (current domain, THE domain)
LINE: while (<$IN>) {
	my @arr = split(/\", \"/, $_);
	$time[0] = getDTObj($arr[0]);
	if ($arr[1] =~ /^\Q\Ehttp:\/\/www.google.com\/(#|search|url)/ or
		$arr[1] =~ /^\Q\Ehttp:\/\/(www|cpro).baidu.com/) {
		next;
	}
	my @urlarr = split(/\//, $arr[1]);
	my @dnarr = split(/\./, $urlarr[2]);
	if ($dnarr[$#dnarr] eq "cn" and
		($dnarr[$#dnarr-1] eq "com" or
		 $dnarr[$#dnarr-1] eq "edu" or
		 $dnarr[$#dnarr-1] eq "gov")) {
		$domain[0] = $dnarr[$#dnarr-2];
	} else {
		$domain[0] = $dnarr[$#dnarr-1];
	}

	foreach (@tobefiltered) {
		next LINE if ($domain[0] eq $_);
	}
	
	if (defined($domain[1]) and $domain[0] eq $domain[1]) {
		# within THIS short session
		next;
	} elsif (defined($domain[1]) && defined($time[1])) {# outside
		$time[2] = $time[1];	# session begins <- next time
		if ($time[2] eq $time[3]) {
			print $OUT1 "$time[2],$domain[1]\n";
		}
		print $OUT "$time[2],$time[3],$domain[1]\n";
		$time[3] = $time[1];	# session ends <- next time
		$time[1] = $time[0];	# next time <- current time
		$domain[1] = $domain[0];# THE domain name <- current domain name
	} else {#first line, $time[1] and $domain[1] haven't been initialized yet
		$time[1] = $time[0];
		$time[3] = $time[1];
		$domain[1] = $domain[0];
	}
}
$time[2] = $time[1];
print $OUT "$time[2],$time[3],$domain[1]";

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
