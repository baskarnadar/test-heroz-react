#!/bin/bash
cd /home/ec2-user/heroz-app
npm run build
pm2 restart next-app || pm2 start npm --name "next-app" -- start
