#!/bin/sh

curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
sudo add-apt-repository "deb http://archive.ubuntu.com/ubuntu $(lsb_release -sc) universe"
sudo apt-get update
sudo apt-get install -y nodejs

npm install
