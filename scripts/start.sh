#!/bin/bash
cd /home/ec2-user/heroz-app
npm run build
pm2 restart vite-app || pm2 start npm --name "vite-app" -- start
