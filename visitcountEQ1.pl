#!/usr/bin/perl
use warnings;
use strict;

# find out how many records have visit_count == 1
open(my $IN, "<", "../history_2_major.txt") or die "Can't open input flie: $!";
open(my $OUT, ">", "../revisitedDNs.txt") or die "Can't open input file: $!";
open(my $OUT1, ">", "../visitedonceDNs.txt") or die "Can't open input file: $!";

my $sum = 0;
my $overall = 0;
my %name;
my %name1;
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
	if ($vcarr[1] == 1) {
		$sum++;
		my @dnarr = split(/\./, $urlarr[2]);
		if ($dnarr[$#dnarr] eq "cn" and
			($dnarr[$#dnarr-1] eq "com" or
		 	 $dnarr[$#dnarr-1] eq "edu" or
		 	 $dnarr[$#dnarr-1] eq "gov")) {
			if ($name1{$dnarr[$#dnarr-2]}) {
				$name1{$dnarr[$#dnarr-2]} += $vcarr[1];
			} else {
				$name1{$dnarr[$#dnarr-2]} = $vcarr[1];
			}
		} else {
			if ($name1{$dnarr[$#dnarr-1]}) {
				$name1{$dnarr[$#dnarr-1]} += $vcarr[1];
			} else {
				$name1{$dnarr[$#dnarr-1]} = $vcarr[1];
			}
		}
	} else {# $vcarr[1] > 1
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
	}
	$overall++;
}
my $t = $sum/$overall;
print "$sum/$overall = $t\n";

my @result = sort { $name{$a} <=> $name{$b} } keys %name;
my @result1 = sort {$name1{$a} <=> $name1{$b}} keys %name1;
foreach my $one (@result) {
	print $OUT "$one\,$name{$one}\n";
}
foreach my $one (@result1) {
	print $OUT1 "$one\,$name1{$one}\n";
}
