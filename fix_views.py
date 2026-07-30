import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    content = content.replace('../views/', '../pages/')
    content = content.replace('./views/', './pages/')
    content = content.replace("from '../views", "from '../pages")
    content = content.replace("from './views", "from './pages")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js') or file.endswith('.css'):
            process_file(os.path.join(root, file))

print('Done')
