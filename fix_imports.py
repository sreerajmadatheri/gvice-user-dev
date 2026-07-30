import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace Next.js Link import
    content = re.sub(r"import Link from 'next/link';", r"import { Link } from 'react-router-dom';", content)
    # Replace Next.js usePathname
    content = re.sub(r"import \{ usePathname \} from 'next/navigation';", r"import { useLocation } from 'react-router-dom';", content)
    content = re.sub(r"const pathname = usePathname\(\);", r"const location = useLocation();", content)
    content = re.sub(r"pathname === ", r"location.pathname === ", content)
    
    # Replace Next.js useRouter
    content = re.sub(r"import \{ useRouter \} from 'next/navigation';", r"import { useNavigate } from 'react-router-dom';", content)
    content = re.sub(r"const router = useRouter\(\);", r"const navigate = useNavigate();", content)
    content = re.sub(r"router\.push\(", r"navigate(", content)

    # Replace useParams
    content = re.sub(r"import \{ useParams \} from 'next/navigation';", r"import { useParams } from 'react-router-dom';", content)

    # Replace href= with to= for Link components (this is a bit tricky, but we can do a simple replace)
    content = re.sub(r"<Link\s+href=", r"<Link to=", content)
    content = re.sub(r"<Link\s+(.*?)href=", r"<Link \1to=", content)

    # Remove 'use client'
    content = re.sub(r'^"use client";\n', '', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

print('Done')
