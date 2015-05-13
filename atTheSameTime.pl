#!/usr/bin/perl
use warnings;
use strict;

# out of the sorted (by last_visit_time) table, select the entries that have the same last_visit_time attribute values, and group them

open my $IN, "<", "../history_2_major.txt" or die "Can't open input file: $!";
open my $OUT, ">", "../AtTheSameTime.txt" or die "Can't open output file: $!";

my @tobefiltered = ("doubleclick", "sharethis", "fbcdn", "disqus", "51yes", "pubmatic", "surphace", "atdmt", "outbrain", "zedo", "googlelabs", "addthis", "crwdcntrl", "nextag", "vcimg", "bluekai", "turn", "googleadservices", "rubiconproject", "afy11", "demdex", "allyes", "adosnarbackbeatmedia");

my $c = 0;
my $tmp;
my $first;
my $domain;
LINE: while (<$IN>) {
	my $cp = $_;
	my @arr = split(/,/, $_);
	my @urlarr = split(/\//, $arr[1]);
	my @dnarr = split(/\./, $urlarr[2]);
	if ($dnarr[$#dnarr] eq "cn" and
		($dnarr[$#dnarr-1] eq "com" or
		 $dnarr[$#dnarr-1] eq "edu" or
		 $dnarr[$#dnarr-1] eq "gov")) {
		$domain = $dnarr[$#dnarr-2];
	} else {
		$domain = $dnarr[$#dnarr-1];
	}
	foreach (@tobefiltered) {
		next LINE if ($domain eq $_);
	}
	if (defined($tmp) and $arr[0] eq $tmp) {
		$c++;
		if ($c == 1) {
			print $OUT "================================================\n";
			print $OUT "$first$cp";
		} else {
			print $OUT "$cp";
		}
	} else {
		$c = 0;
		$first = $cp;
		$tmp = $arr[0];
	}
}
