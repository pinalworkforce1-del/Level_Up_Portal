# First Day Challenge narration media repair

The 21 MP4 files currently committed under `assets/media/` are incomplete/truncated MP4 containers and cannot play in a browser.

Upload these two source packages to this folder on the `fdc-media-repair` branch:

- `fdc-narration-media-a.zip`
- `fdc-narration-media-b.zip`

The deployment and PR-test workflows will unpack them into `public/first-day-challenge/assets/media/`, overwrite the broken MP4s for the build, remove the ZIP packages from the Pages artifact, and verify that all 21 output MP4s contain both `moov` and `mdat` atoms before the build can succeed.

The replacement files were extracted directly from the original `First Day Challenge_use pilot(1).pptx` source deck.