import os, re

for root, _, files in os.walk(r'c:\Users\stuti\OneDrive\Desktop\shgtesting\frontend\src'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find any quotes surrounding a single JSX tag: `'<IconName ... />'` -> `<IconName ... />`
            new_content = re.sub(r"['\"](<[A-Z][A-Za-z0-9]+\s+[^>]*?/>)['\"]", r"\1", content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print('Fixed quotes in', file)
