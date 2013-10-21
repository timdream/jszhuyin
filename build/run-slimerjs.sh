#!/bin/bash

[ -z $SLIMERJS ] && SLIMERJS=slimerjs

echo 'Testing '$1

$SLIMERJS ./test/headless-runner.js $1 | tee ${TMPDIR}/slimerjs.log

# Figure out the exit code ourselves because Gecko does not allow
# SlimerJS to do so for now.
[ -z "`grep '0 failed.' ${TMPDIR}/slimerjs.log`" ] && ERROR=1
rm ${TMPDIR}/slimerjs.log
exit $ERROR
