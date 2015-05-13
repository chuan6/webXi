#!/usr/bin/perl
use strict;
use warnings;

open(my $IN, "<", "../1.txt") or die "Can't open the file: $!";
open(my $OUT, ">", "../3.txt") or die "Can't open the file: $!";

while (<$IN>) {	#each line read is in default variable $_
	my @ins = split(/\|\| \|\|/, $_);

	print $OUT "\"$ins[0]\", ";

	my @attr2chararr = split(//, $_);
	foreach (@attr2chararr) {
		if ($_ eq "\"") {
			
		}
	}
	print $OUT "\"$ins[1]\", ";
	if ($ins[2] eq '') {
		print $OUT "?, ";
	} else {
		print $OUT "\"$ins[2]\", ";
	}
	print $OUT "$ins[3]";
}

close $IN or die "$IN: $!";
close $OUT or die "$OUT: $!";
