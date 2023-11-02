#!/bin/sh

DIR=../../servers/croquet-io-dev/react-musicbox

if [ -z $1 ]; then
    echo "specify the source directory"
    exit 1
fi

(cd $1; npm run build)

rsync --delete -r "$1"/dist/assets "$1"/dist/index.html $DIR
## this keeps .env file in $DIR
