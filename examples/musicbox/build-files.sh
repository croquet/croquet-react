#!/bin/sh

if [ -d dist ]
then
       rm -rf dist
fi

if [ -d copy ]
then
       rm -rf copy
fi

META=`git log --no-walk|grep -v '^Author' |head -2 |tr '\n' ' '`
COMMIT=`echo ${META} | awk '{print $2}'`

mkdir -p copy/${COMMIT}
mkdir -p copy/meta

echo ${COMMIT}> copy/meta/version.txt

npm run build

cp dist/app.js copy/${COMMIT}/app.js
cp style.css copy/${COMMIT}/style.css

cat index.html | sed 's:\.\/dist/app.js:\.\/'${COMMIT}'\/app.js:' | \
  sed 's:\.\/style.css:\.\/'${COMMIT}'\/style.css:'  > copy/index.html