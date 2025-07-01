#!/usr/bin/env python3
"""Simple image relighting script"""
import argparse
from PIL import Image, ImageEnhance


def create_light_mask(size, lx, ly, intensity):
    width, height = size
    mask = Image.new("L", (width, height))
    max_distance = (width**2 + height**2) ** 0.5

    for y in range(height):
        for x in range(width):
            dx = x - lx * width
            dy = y - ly * height
            dist = (dx ** 2 + dy ** 2) ** 0.5
            factor = max(0.0, 1.0 - dist / max_distance)
            value = int(255 * min(1.0, factor * intensity))
            mask.putpixel((x, y), value)
    return mask


def relight_image(input_path, output_path, lx=0.5, ly=0.5, intensity=1.5):
    image = Image.open(input_path).convert("RGB")

    enhancer = ImageEnhance.Brightness(image)
    bright = enhancer.enhance(intensity)

    mask = create_light_mask(image.size, lx, ly, intensity - 1)

    result = Image.composite(bright, image, mask)
    result.save(output_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Relight an image with a point light source")
    parser.add_argument("input", help="path to the input image")
    parser.add_argument("output", help="path for the output image")
    parser.add_argument("--x", type=float, default=0.5, help="light x position (0-1)")
    parser.add_argument("--y", type=float, default=0.5, help="light y position (0-1)")
    parser.add_argument(
        "--intensity", type=float, default=1.5, help="brightness factor (>1 for brighter)"
    )

    args = parser.parse_args()
    relight_image(args.input, args.output, args.x, args.y, args.intensity)

