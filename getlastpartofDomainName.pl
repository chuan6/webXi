#!/usr/bin/perl
use strict;
use warnings;

# check how all the domain names end, such as: com, org, cn, ...

open(my $IN, "<", "../history_1_allhttp.txt") or die "Can't open input file: $!";
open(my $OUT, ">", "../domain_names_end_with.txt") or die "Can't open output file: $!";

my %ends;
while (<$IN>) {
	chomp;
	my @arr = split(/\", /, $_);
	my @urlarr = split(/\//, $arr[1]);
	my @vcarr;
	if ($#arr == 2) {# no "title"
		@vcarr = split(/\, /, $arr[2]);
	} else {# with "title"
		@vcarr = (0, $arr[3]);
	}
	my @dnarr = split(/\./, $urlarr[2]);
	if ($ends{$dnarr[$#dnarr]}) {
		$ends{$dnarr[$#dnarr]} += $vcarr[1];
	} else {
		$ends{$dnarr[$#dnarr]} = $vcarr[1];
	}
}

my @result = sort { $ends{$a} <=> $ends{$b} } keys %ends;
foreach my $one (@result) {
	print $OUT "$one\,$ends{$one}\n";
}
