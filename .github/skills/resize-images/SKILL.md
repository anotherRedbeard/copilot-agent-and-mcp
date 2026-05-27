---
name: resize-images
description: 'Resize images with Python and Pillow into large, medium, small, and thumbnail variants. Use for batch image prep, responsive asset generation, and creating standardized output sizes from a file or directory.'
argument-hint: 'Provide --input path plus optional --output, --sizes, and --overwrite flags'
user-invocable: true
---

# Resize Images

## What This Skill Does

Uses Python and Pillow to create resized image variants while preserving aspect ratio.

- Variants: `large`, `medium`, `small`, `thumbnail`
- Inputs: single image file or directory
- Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`
- Default output directory: `images/resized`

## When To Use

- Generate responsive image assets for web pages
- Normalize image sizes for demos or docs
- Batch resize a folder of mixed supported images

## Workflow

1. Choose an input path with `--input`.
2. Optionally choose output with `--output` (default is `images/resized`).
3. Optionally choose a subset of sizes with `--sizes`.
4. Run the script.
5. Review generated files in the output folder.

## Command

Run from the repository root:

```bash
python ./.github/skills/resize-images/resize_images.py --input <path>
```

## Flags

- `--input`: Required. File or directory to process.
- `--output`: Optional. Output directory. Default: `images/resized`.
- `--sizes`: Optional comma-separated size names. Valid values: `large,medium,small,thumbnail`. Default: all four.
- `--overwrite`: Optional flag. Overwrite files if they already exist.

## Usage Examples

Resize a single file into all variants:

```bash
python ./.github/skills/resize-images/resize_images.py \
  --input ./images/cover.jpg
```

Resize a directory into only medium and thumbnail variants:

```bash
python ./.github/skills/resize-images/resize_images.py \
  --input ./images/source \
  --sizes medium,thumbnail
```

Write output to a custom folder and overwrite existing files:

```bash
python ./.github/skills/resize-images/resize_images.py \
  --input ./images/source \
  --output ./images/resized-set-2 \
  --overwrite
```

## Resources

- Script: [resize_images.py](./resize_images.py)