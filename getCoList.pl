#!/usr/bin/perl
use warnings;
use strict;

# get the "facebook" part of the domain name
open(my $IN, "<", "../history_2_major.txt") or die "Can't open input file: $!";
open(my $OUT, ">", "../facebook.txt") or die "Can't open output file: $!";

my %name;
my $stat_numOfAllVisits = 0;
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
	if ($dnarr[$#dnarr] eq "cn" and
		($dnarr[$#dnarr-1] eq "com" or
		 $dnarr[$#dnarr-1] eq "edu" or
		 $dnarr[$#dnarr-1] eq "gov")) {
		if ($name{$dnarr[$#dnarr-2]}) {
			$name{$dnarr[$#dnarr-2]} += $vcarr[1];
		} else {
			$name{$dnarr[$#dnarr-2]} = $vcarr[1];
		}
	} else {
		if ($name{$dnarr[$#dnarr-1]}) {
			$name{$dnarr[$#dnarr-1]} += $vcarr[1];
		} else {
			$name{$dnarr[$#dnarr-1]} = $vcarr[1];
		}
	}
	$stat_numOfAllVisits += $vcarr[1];
}

print $OUT "Overall, there are $stat_numOfAllVisits visits.\n\n";

my @result = sort { $name{$a} <=> $name{$b} } keys %name;
my $cv = 0;	# count of visits
my $cn = 0;	# count of names
my $apercent = int $stat_numOfAllVisits/100;
foreach my $one (@result) {
	$cv += $name{$one};
	$cn++;
	print $OUT "$one\,$name{$one}\n";
	if ($cv > $apercent) {
		my $p = int (($cv/$stat_numOfAllVisits)*100);
		my $avg = $cv/$cn;
		print $OUT "<=======[$cv/$cn=$avg, around $p% of all visits]=======>\n";
		$cv = 0;
		$cn = 0;
	}
}
