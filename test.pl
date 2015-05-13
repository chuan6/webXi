#!/usr/bin/perl
use warnings;
use strict;

open my $IN, "<", "../history_2_major.txt" or die "Can't open input file: $!";
open my $OUT, ">", "../google.txt" or die "Can't open output file: $!";

while (<$IN>) {
	if ($_ =~ m*http://www.google.com/#*) {
		print $OUT "$_\n";
	}
}
