# Light Matching

This repository contains a small Python application that can relight images using a simple lighting model. The script relies on the [Pillow](https://python-pillow.org) library.

## Requirements

- Python 3.8+
- Pillow

Install the requirements with:

```bash
pip install -r requirements.txt
```

## Usage

Run the script with an input image path and an output path. You can optionally specify the light position `(x,y)` in the range `0-1` and the intensity factor (greater than `1` to brighten):

```bash
python relight.py input.jpg output.jpg --x 0.5 --y 0.2 --intensity 1.5
```

This will brighten the area around `(0.5, 0.2)` of the image and save the result as `output.jpg`.

