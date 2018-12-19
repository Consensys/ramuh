[![CircleCI](https://circleci.com/gh/ConsenSys/ramuh.svg?style=svg&circle-token=1a338ebf21755619e0dc1aae7e800be754348635)](https://circleci.com/gh/ConsenSys/ramuh)

# Ramuh, a real-time security notifier

Ramuh brings the power of the MythX Platform API to your desktop.

It watches directories for changes on smart contract files, sends
data to MythX security analysis platform and shows relevant security
issues found on your code as desktop notifications.

# How to use

First, install ramuh package:
```
$ npm i -g ramuh
```
For using ramuh you need MythX platform credential, either as an API key
or as a eth address and password pair. Ramuh expects these values to be set
as the environment variables `MYTHX_API_KEY` or `MYTHX_ETH_ADDRESS` and
`MYTHX_PASSWORD`.
Then, start it indicating MythX platform access credentials and the
directory to watch:
```
$ ramuh -contractspath /path/to/contracts
```
From this point, when you change `*.sol` files in `/path/to/contracts`, an
analysis request is sent to the MythX API endpoint. If any security issue is
detected, it will be shown to you as a desktop notification.

Here is a video about how all this works:

[![Ramuh - MythX interaction](http://img.youtube.com/vi/MQxYBHuYeEA/0.jpg)](http://www.youtube.com/watch?v=MQxYBHuYeEA "Ramuh - MythX interaction")
https://youtu.be/MQxYBHuYeEA

For more info join the MythX community at [Discord](https://discord.gg/kktn8Wt).
