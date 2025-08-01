python3 /root/mysite/web/script/magic.py
cd /root/mysite/web

cd /root/mysite/web/EEnotes
mv ./docs/mkdocs.yml ./mkdocs.yml

mkdocs build

rm -rf /root/mysite/web/html/docs-html/
cp -r ./site /root/mysite/web/html/docs-html/

