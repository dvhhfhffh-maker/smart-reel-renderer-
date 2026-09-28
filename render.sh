#!/usr/bin/env bash
set -euo pipefail

mkdir -p work output

download_image() {
  local url="$1"
  local out="$2"
  curl -L --fail --retry 3 --retry-delay 2 "$url" -o "$out"
}

download_image "$IMAGE1_URL" work/scene1.jpg
download_image "$IMAGE2_URL" work/scene2.jpg
download_image "$IMAGE3_URL" work/scene3.jpg
download_image "$IMAGE4_URL" work/scene4.jpg

ffmpeg -y \
  -loop 1 -t 3 -i work/scene1.jpg \
  -loop 1 -t 3 -i work/scene2.jpg \
  -loop 1 -t 3 -i work/scene3.jpg \
  -loop 1 -t 3 -i work/scene4.jpg \
  -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':d=90:s=1080x1920:fps=30,setsar=1[v0];[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':d=90:s=1080x1920:fps=30,setsar=1[v1];[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':d=90:s=1080x1920:fps=30,setsar=1[v2];[3:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':d=90:s=1080x1920:fps=30,setsar=1[v3];[v0][v1]xfade=transition=fade:duration=0.5:offset=2.5[x1];[x1][v2]xfade=transition=fade:duration=0.5:offset=5.0[x2];[x2][v3]xfade=transition=fade:duration=0.5:offset=7.5[v]" \
  -map "[v]" \
  -t 10.5 \
  -r 30 \
  -c:v libx264 \
  -preset veryfast \
  -crf 21 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  output/reel.mp4

echo "Created output/reel.mp4"
