#!/usr/bin/perl
use warnings;
use strict;

# only urls end with "edu"(209), "org"(323), "cn"(818), "net"(1994), and "com"(11685).
open(my $IN, "<", "../history_1_allhttp.txt") or die "Can't open input file: $!";
open(my $OUT, ">", "../history_2_major.txt") or die "Can't open output file: $!";

my @collection = ("edu", "org", "cn", "net", "com");

while (<$IN>) {
	my $copy = $_;
	my @arr = split(/\", \"/, $copy);
	my @urlarr = split(/\//, $arr[1]);
	my @dnarr = split(/\./, $urlarr[2]);
	foreach (@collection) {
		if ($dnarr[$#dnarr] eq $_) {
			print $OUT $copy;
		}
	}
}
