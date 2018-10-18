#!/usr/bin/env bash

rm -rf database
mkdir database
cd csv2db
npm install
docker-compose up -d

