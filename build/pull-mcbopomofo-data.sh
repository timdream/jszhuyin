#!/bin/bash

[ -z $MAKE ] && MAKE=make
[ -z $GIT ] && GIT=git
[ -z $MC_BOPOMOFO_REPO ] &&\
  MC_BOPOMOFO_REPO=git://github.com/mjhsieh/McBopomofo.git

echo Pulling McBopomofo...
rm -rf ${TMPDIR}/McBopomofo
${GIT} clone --depth=1 ${MC_BOPOMOFO_REPO} ${TMPDIR}/McBopomofo
echo
echo Generate data.txt...
${MAKE} -C ${TMPDIR}/McBopomofo/Source/Data data.txt
echo
echo Copying data.txt and cleaning up...
mkdir -p ./data
cp ${TMPDIR}/McBopomofo/Source/Data/data.txt ./data/
${GIT} --git-dir=${TMPDIR}/McBopomofo/.git log -n 1 --format=%H > \
  ./data/data-commit-hash
rm -rf ${TMPDIR}/McBopomofo
