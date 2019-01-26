#!/bin/bash

if [ ! -d "node_modules" ]; then 
    npm install
fi
npm install supervisor -g
supervisor $1
