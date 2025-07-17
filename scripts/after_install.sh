#!/bin/bash
set -xe

# Ensure ec2-user owns the app folder
sudo chown -R ec2-user:ec2-user /home/ec2-user/heroz-app

cd /home/ec2-user/heroz-app

echo 'Running npm install...' >> /home/ec2-user/heroz-app/deploy.log
npm install >> /home/ec2-user/heroz-app/deploy.log 2>&1
