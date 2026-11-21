#!/usr/bin/env python3
"""Create the audited Forma UI source + benchmark ZIP from the file manifest.

The large, deterministic JSONL benchmark datasets are stored without recompression
so the release archive can be consumed as a ready-to-stream test corpus. The preserved
RAR source archive is also stored without recompression. Every member is streamed from
disk and checked against its SHA-256 before completion.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_RELATIVE = "docs/archive-manifest.json"
ARCHIVE_PREFIX = "forma-ui/"
FIXED_TIME = (2026, 11, 17, 12, 0, 0)
MINIMUM_ARCHIVE_BYTES = 100_000_000
CHUNK_SIZE = 1024 * 1024


def safe_relative_path(value: str) -> PurePosixPath:
    path = PurePosixPath(value)
    if path.is_absolute() or not path.parts or ".." in path.parts or "\\" in value:
        raise ValueError(f"Unsafe manifest path: {value!r}")
    return path


def digest_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    total = 0
    with path.open("rb") as source:
        while chunk := source.read(CHUNK_SIZE):
            digest.update(chunk)
            total += len(chunk)
    return digest.hexdigest(), total


def digest_stream(path: Path, target) -> tuple[str, int]:
    digest = hashlib.sha256()
    total = 0
    with path.open("rb") as source:
        while chunk := source.read(CHUNK_SIZE):
            digest.update(chunk)
            total += len(chunk)
            target.write(chunk)
    return digest.hexdigest(), total


def sha256_path(path: Path) -> str:
    digest, _ = digest_file(path)
    return digest


def build_archive(output: Path) -> tuple[str, int, int, int, int]:
    output = output.expanduser().resolve()
    try:
        output.relative_to(ROOT)
    except ValueError:
        pass
    else:
        raise ValueError("Archive output must be outside the repository root.")

    manifest_path = ROOT / MANIFEST_RELATIVE
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    entries = manifest.get("files")
    if not isinstance(entries, list) or not entries:
        raise ValueError("Archive manifest has no file entries.")

    seen: set[str] = set()
    total_uncompressed = 0
    stored_fixture_bytes = 0
    expected_names: set[str] = {ARCHIVE_PREFIX + MANIFEST_RELATIVE}
    normalized_entries: list[tuple[str, dict, Path, int]] = []
    for entry in entries:
        relative = safe_relative_path(entry["path"])
        relative_text = relative.as_posix()
        if relative_text in seen or relative_text == MANIFEST_RELATIVE:
            raise ValueError(f"Duplicate or self-referential path: {relative_text}")
        seen.add(relative_text)
        source = ROOT.joinpath(*relative.parts)
        if source.is_symlink() or not source.is_file():
            raise ValueError(f"Missing, non-file or symlink source: {relative_text}")
        size = source.stat().st_size
        if size != entry["bytes"]:
            raise ValueError(f"Source size changed since manifest generation: {relative_text}")
        is_benchmark = relative_text.startswith("fixtures/benchmarks/") and relative_text.endswith(".jsonl")
        is_preserved_archive = relative_text.endswith(".rar")
        if is_benchmark:
            if size >= 100_000_000:
                raise ValueError(f"Benchmark fixture exceeds the 100 MB single-file policy: {relative_text} ({size:,} bytes)")
            if entry.get("archiveCompression") != "STORE":
                raise ValueError(f"Benchmark fixture must be marked STORE in manifest: {relative_text}")
            stored_fixture_bytes += size
        if is_preserved_archive and entry.get("archiveCompression") != "STORE":
            raise ValueError(f"Preserved source archive must be marked STORE: {relative_text}")
        normalized_entries.append((relative_text, entry, source, size))
        total_uncompressed += size
        expected_names.add(ARCHIVE_PREFIX + relative_text)
        parts = relative.parts[:-1]
        for index in range(1, len(parts) + 1):
            expected_names.add(ARCHIVE_PREFIX + "/".join(parts[:index]) + "/")
    expected_names.add(ARCHIVE_PREFIX)

    if total_uncompressed != manifest["summary"]["totalBytes"]:
        raise ValueError("Manifest total byte count does not match its entries.")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", allowZip64=True, strict_timestamps=True) as archive:
        for name in sorted(expected_names):
            if name.endswith("/"):
                info = zipfile.ZipInfo(name, FIXED_TIME)
                info.external_attr = (stat.S_IFDIR | 0o755) << 16
                info.compress_type = zipfile.ZIP_STORED
                archive.writestr(info, b"")

        for name, entry, source, size in sorted(normalized_entries, key=lambda item: item[0]):
            is_benchmark = name.startswith("fixtures/benchmarks/") and name.endswith(".jsonl")
            is_preserved_archive = name.endswith(".rar")
            info = zipfile.ZipInfo(ARCHIVE_PREFIX + name, FIXED_TIME)
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.file_size = size
            info.compress_type = zipfile.ZIP_STORED if (is_benchmark or is_preserved_archive) else zipfile.ZIP_DEFLATED
            with archive.open(info, "w", force_zip64=True) as target:
                digest, copied = digest_stream(source, target)
            if copied != size or digest != entry["sha256"]:
                raise ValueError(f"Source changed or SHA-256 mismatch while archiving: {name}")

        info = zipfile.ZipInfo(ARCHIVE_PREFIX + MANIFEST_RELATIVE, FIXED_TIME)
        info.external_attr = (stat.S_IFREG | 0o644) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, manifest_bytes, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    if output.stat().st_size <= MINIMUM_ARCHIVE_BYTES:
        raise ValueError(
            f"Archive is {output.stat().st_size:,} bytes; user requirement is strictly greater than 100 MB "
            f"({MINIMUM_ARCHIVE_BYTES:,} bytes)."
        )

    with zipfile.ZipFile(output, "r") as archive:
        bad_member = archive.testzip()
        if bad_member:
            raise RuntimeError(f"ZIP CRC check failed for {bad_member}")
        actual_files = {name for name in archive.namelist() if not name.endswith("/")}
        expected_file_names = {ARCHIVE_PREFIX + name for name in seen | {MANIFEST_RELATIVE}}
        if actual_files != expected_file_names:
            missing = sorted(expected_file_names - actual_files)
            extra = sorted(actual_files - expected_file_names)
            raise RuntimeError(f"ZIP contents differ from manifest; missing={missing[:5]}, extra={extra[:5]}")
        for name, _, _, _ in normalized_entries:
            if name.startswith("fixtures/benchmarks/") and name.endswith(".jsonl"):
                member = archive.getinfo(ARCHIVE_PREFIX + name)
                if member.compress_type != zipfile.ZIP_STORED:
                    raise RuntimeError(f"Benchmark fixture was compressed instead of stored: {name}")
            if name.endswith(".rar") and archive.getinfo(ARCHIVE_PREFIX + name).compress_type != zipfile.ZIP_STORED:
                raise RuntimeError(f"Preserved RAR archive was recompressed: {name}")

    digest = sha256_path(output)
    checksum_path = output.with_suffix(output.suffix + ".sha256")
    checksum_path.write_text(f"{digest}  {output.name}\n", encoding="ascii")
    return digest, output.stat().st_size, total_uncompressed, stored_fixture_bytes, len(normalized_entries)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="ZIP output path (must be outside the project root)")
    args = parser.parse_args()
    try:
        digest, compressed, uncompressed, fixtures, file_count = build_archive(args.output)
    except Exception as error:  # CLI boundary: show an actionable failure and non-zero exit.
        print(f"Archive creation failed: {error}", file=sys.stderr)
        return 1
    print(f"Archive: {args.output.resolve()}")
    print(f"ZIP size: {compressed:,} bytes ({compressed / 1_000_000:.2f} MB)")
    print(f"Source payload: {uncompressed:,} bytes")
    print(f"Stored benchmark corpus: {fixtures:,} bytes")
    print(f"Audited source files: {file_count}")
    print(f"SHA-256: {digest}")
    print(f"Checksum: {args.output.resolve()}.sha256")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
