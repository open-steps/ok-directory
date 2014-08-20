#!/bin/bash
curl -H "Accept: application/ld+json" $1 > tmp.json
node ./addPerson.js
rm tmp.json
