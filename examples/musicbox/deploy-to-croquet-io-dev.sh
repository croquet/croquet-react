#!/bin/sh

. ./build-files.sh $1

DIR=../../servers/croquet-io-dev/react-musicbox

if [ "$1" != "" ]
then
    DIR=../../servers/croquet-io-dev/$1/
fi

mkdir -p $DIR
rsync --delete -r copy/ $DIR
