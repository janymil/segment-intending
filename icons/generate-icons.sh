#!/bin/bash
# Generate placeholder icons using ImageMagick
# This creates simple gradient circle icons until proper design is ready

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Create a simple gradient icon with the app colors
# Using purple to cyan gradient (#7c5cfc to #36d1dc)

# 72x72 icon
convert -size 72x72 gradient:'#7c5cfc'-'#36d1dc' \
    \( +clone -background black -shadow 80x3+0+0 \) +swap \
    -background none -layers merge \
    -fill white -stroke white -strokewidth 0 \
    -draw "circle 36,36 36,10" \
    -alpha set -channel A -evaluate multiply 0 +channel \
    gradient:'#7c5cfc'-'#36d1dc' -compose over -composite \
    icon-72.png

# 192x192 icon  
convert -size 192x192 gradient:'#7c5cfc'-'#36d1dc' \
    -fill white -stroke white -strokewidth 4 \
    -draw "circle 96,96 96,30" \
    -fill none -stroke white -strokewidth 2 \
    -draw "circle 96,96 96,60" \
    icon-192.png

# 512x512 icon
convert -size 512x512 gradient:'#7c5cfc'-'#36d1dc' \
    -fill white -stroke white -strokewidth 10 \
    -draw "circle 256,256 256,80" \
    -fill none -stroke white -strokewidth 5 \
    -draw "circle 256,256 256,160" \
    icon-512.png

echo "Icons generated successfully!"
