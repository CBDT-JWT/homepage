from pathlib import Path
import re
import shutil
import requests
import hashlib

# 设置根目录
root_dir = Path("/root/mysite/web/EEnotes/docs")  # ← 修改为你的路径

# 匹配 markdown 图像（不含 style）
markdown_img_pattern = re.compile(r'!\[([^\]]*)\]\(([^)\s]+)\)(?!\{:.*?\})')
# 匹配 HTML 图像
html_img_pattern = re.compile(r'<img\s+[^>]*src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\'][^>]*>', re.IGNORECASE)

# 统一格式
def format_image(alt, src):
    return f'![{alt}]({src}){{: style="display: block; margin: auto; width: 60%;" }}'

# 下载远程图片
def download_image(url, asset_dir):
    asset_dir.mkdir(exist_ok=True)
    try:
        # 使用文件名或哈希作为本地名
        ext = Path(url).suffix or ".png"
        name_hash = hashlib.sha1(url.encode()).hexdigest()
        filename = f"{name_hash}{ext}"
        filepath = asset_dir / filename

        if not filepath.exists():
            print(f"Downloading {url} -> {filepath}")
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            filepath.write_bytes(resp.content)
        return filepath
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return None

# 处理所有 Markdown 文件
for file_path in root_dir.rglob("*.md"):
    content = file_path.read_text(encoding="utf-8")
    original_content = content
    file_dir = file_path.parent
    asset_dir = file_dir / "assets"

    # 替换 markdown 图片语法
    def replace_markdown(match):
        alt, src = match.group(1), match.group(2)
        if src.startswith("http://") or src.startswith("https://"):
            local_img = download_image(src, asset_dir)
            if local_img:
                rel_path = local_img.relative_to(file_dir)
                return format_image(alt, rel_path)
            else:
                return match.group(0)  # 保留原图
        else:
            return format_image(alt, src)

    content = markdown_img_pattern.sub(replace_markdown, content)

    # 替换 HTML 图片语法
    def replace_html(match):
        src, alt = match.group(1), match.group(2)
        if src.startswith("http://") or src.startswith("https://"):
            local_img = download_image(src, asset_dir)
            if local_img:
                rel_path = local_img.relative_to(file_dir)
                return format_image(alt, rel_path)
            else:
                return match.group(0)
        else:
            return format_image(alt, src)

    content = html_img_pattern.sub(replace_html, content)

    # 写入文件（若发生更改）
    if content != original_content:
        backup_path = file_path.with_suffix(file_path.suffix + ".bak")
        if backup_path.exists():
            backup_path.unlink()
        shutil.copy2(file_path, backup_path)
        file_path.write_text(content, encoding="utf-8")
        print(f"Updated: {file_path.relative_to(root_dir)} (backup replaced)")
    else:
        print(f"Skipped: {file_path.relative_to(root_dir)}")
