#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
SIZE_PRESETS: dict[str, tuple[int, int]] = {
    "large": (1600, 1600),
    "medium": (1024, 1024),
    "small": (640, 640),
    "thumbnail": (256, 256),
}


def parse_sizes(raw_sizes: str | None) -> list[str]:
    if not raw_sizes:
        return list(SIZE_PRESETS.keys())

    requested = [part.strip().lower() for part in raw_sizes.split(",") if part.strip()]
    if not requested:
        raise ValueError("No valid sizes were provided.")

    invalid = [size for size in requested if size not in SIZE_PRESETS]
    if invalid:
        valid = ", ".join(SIZE_PRESETS.keys())
        raise ValueError(f"Invalid size(s): {', '.join(invalid)}. Valid values: {valid}")

    ordered_unique: list[str] = []
    seen: set[str] = set()
    for size in requested:
        if size not in seen:
            seen.add(size)
            ordered_unique.append(size)
    return ordered_unique


def collect_input_images(input_path: Path) -> list[Path]:
    if input_path.is_file():
        if input_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file extension: {input_path.suffix}. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )
        return [input_path]

    if input_path.is_dir():
        return sorted(
            p
            for p in input_path.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
        )

    raise ValueError(f"Input path does not exist: {input_path}")


def save_variant(
    source: Path,
    output_file: Path,
    max_size: tuple[int, int],
    overwrite: bool,
) -> str:
    if output_file.exists() and not overwrite:
        return f"SKIP  {output_file} (already exists, use --overwrite)"

    output_file.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as img:
        resized = img.copy()
        resized.thumbnail(max_size, Image.Resampling.LANCZOS)

        save_kwargs: dict[str, int] = {}
        output_suffix = output_file.suffix.lower()

        if output_suffix in {".jpg", ".jpeg"} and resized.mode in {"RGBA", "LA", "P"}:
            background = Image.new("RGB", resized.size, (255, 255, 255))
            alpha = resized.getchannel("A") if "A" in resized.getbands() else None
            if alpha is not None:
                background.paste(resized.convert("RGBA"), mask=alpha)
                resized = background
            else:
                resized = resized.convert("RGB")

        if output_suffix in {".jpg", ".jpeg"}:
            save_kwargs["quality"] = 90

        resized.save(output_file, **save_kwargs)

    return f"WRITE {output_file}"


def build_output_path(source: Path, input_root: Path, output_root: Path, size_name: str) -> Path:
    suffix = source.suffix.lower()
    stem_with_size = f"{source.stem}_{size_name}{suffix}"

    if input_root.is_file():
        return output_root / stem_with_size

    relative_parent = source.relative_to(input_root).parent
    return output_root / relative_parent / stem_with_size


def run(input_path: Path, output_path: Path, sizes: list[str], overwrite: bool) -> int:
    images = collect_input_images(input_path)
    if not images:
        print("No supported images found to process.")
        return 0

    writes = 0
    skips = 0

    for image in images:
        for size_name in sizes:
            out_file = build_output_path(
                source=image,
                input_root=input_path,
                output_root=output_path,
                size_name=size_name,
            )
            result = save_variant(
                source=image,
                output_file=out_file,
                max_size=SIZE_PRESETS[size_name],
                overwrite=overwrite,
            )
            print(result)
            if result.startswith("WRITE"):
                writes += 1
            else:
                skips += 1

    print(f"Done. Wrote {writes} file(s). Skipped {skips} file(s).")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Resize images into large, medium, small, and thumbnail variants."
    )
    parser.add_argument("--input", required=True, help="Input image file or directory")
    parser.add_argument(
        "--output",
        default="images/resized",
        help="Output directory (default: images/resized)",
    )
    parser.add_argument(
        "--sizes",
        default=None,
        help="Comma-separated sizes: large,medium,small,thumbnail (default: all)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite output files if they already exist",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        sizes = parse_sizes(args.sizes)
        return run(
            input_path=Path(args.input),
            output_path=Path(args.output),
            sizes=sizes,
            overwrite=args.overwrite,
        )
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())