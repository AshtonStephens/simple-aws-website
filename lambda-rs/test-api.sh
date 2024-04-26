#!/bin/zsh

RESPONSE=$(curl -X POST -d "little demo stringy" localhost:3000/messages)

echo "Raw response ------------------------ "
echo $RESPONSE

echo "Json response ----------------------- "
echo $RESPONSE | jq

curl -X GET localhost:3000/messages/$(echo $RESPONSE | jq -r ".id")
