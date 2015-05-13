#!/usr/bin/perl
use strict;
use warnings;

# eliminate the non-http or non-https urls

open(my $IN, "<", "../history_0.txt") or die "Can't open input file: $!";
open(my $OUT, ">", "../history_1_allhttp.txt") or die "Can't open input file: $!";

while (<$IN>) {
	my $copy = $_;
	my @arr = split(/\", \"/, $copy);
	if (isStartwithHTTP($arr[1])) {
		print $OUT $copy;
	} else {
		print "$arr[1]\n";
	}
}

# parameters: a string
# return: if the input string is start with http:// (or https://) or not
sub isStartwithHTTP {
	my $str = $_[0];
	my @split = split(/:\/\//, $str);
	if ($split[0] eq "http" or $split[0] eq "https") {
		return 1;
	} else {
		return 0;
	}
}
