#!/usr/bin/perl
use strict;
use warnings;

# query component of url is not relavant to the analysis, and is cut to protect privacy

open(my $IN, "<", "../3-1.arff") or die "Can't open the file: $!";
open(my $OUT, ">", "../3withoutquery.arff") or die "Can't open the file: $!";

while (<$IN>) {
	my @ins = split(/", /, $_);
	print $OUT "$ins[0]\", ";
	my @attr2chararr = split(//, $ins[1]);
	foreach (@attr2chararr) {
		last if ($_ eq "?");
		print $OUT "$_";
	}
	print $OUT "\", ";
	if (@ins == 3) {
		print $OUT "$ins[2]";
	} elsif (@ins == 4) {
		print $OUT "$ins[2]\", ";
		print $OUT "$ins[3]";
	}
}

close $IN or die "$IN: $!";
close $OUT or die "$OUT: $!";
