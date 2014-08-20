#!/bin/bash
curl -H "Accept: application/ld+json" $1 > tmp.json
node ./addPersons.js
rm tmp.json
