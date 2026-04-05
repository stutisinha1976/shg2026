import os
import re

emoji_map = {
    '💬': 'MessageSquare',
    '⚠️': 'AlertTriangle',
    '🚪': 'LogOut',
    '🤖': 'Bot',
    '📈': 'TrendingUp',
    '👥': 'Users',
    '📊': 'BarChart2',
    '📥': 'Download',
    '🧠': 'Brain',
    '💡': 'Lightbulb',
    '⚡': 'Zap',
    '💰': 'IndianRupee',
    '📤': 'Upload',
    '✕': 'X',
    '🖼️': 'Image',
    '🖼': 'Image',
    '🔍': 'Search',
    '▶️': 'Play',
    '⏹️': 'Square',
    '🎤': 'Mic',
    '🛑': 'Octagon',
    '🔊': 'Volume2',
    '🔈': 'VolumeX'
}

def inject_import(content, icons_needed):
    if not icons_needed: return content
    
    # Check if lucide-react is already imported
    import_match = re.search(r"import\s+{([^}]+)}\s+from\s+['\"]lucide-react['\"]", content)
    
    if import_match:
        existing_icons = [i.strip() for i in import_match.group(1).split(',')]
        new_icons = list(set(existing_icons + list(icons_needed)))
        new_import = f"import {{ {', '.join(new_icons)} }} from 'lucide-react'"
        content = content.replace(import_match.group(0), new_import)
    else:
        new_import = f"import {{ {', '.join(icons_needed)} }} from 'lucide-react'\n"
        # insert after first active import
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('import ') and 'react' in line.lower():
                lines.insert(i + 1, new_import)
                content = '\n'.join(lines)
                break
        else:
            content = new_import + content
    return content

for root, _, files in os.walk(r'c:\Users\stuti\OneDrive\Desktop\shgtesting\frontend\src'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            icons_needed = set()
            
            # Find all emojis and replace
            for emoji, icon in emoji_map.items():
                if emoji in content:
                    content = content.replace(emoji, f"<{icon} size={{18}} className='inline-block mr-1' />")
                    icons_needed.add(icon)
                    modified = True
            
            # Auth.jsx manual replacement
            if 'Auth.jsx' in file:
                content = re.sub(r'const (EyeIcon|EyeOffIcon|LockIcon|MailIcon|UserIcon|KeyIcon|CheckIcon|XIcon|ArrowRightIcon|ArrowLeftIcon) = \(\) => \([\s\S]*?\n\)\n+', '', content)
                content = re.sub(r'<EyeIcon\s*/>', '<Eye size={20} />', content)
                content = re.sub(r'<EyeOffIcon\s*/>', '<EyeOff size={20} />', content)
                content = re.sub(r'<LockIcon\s*/>', '<Lock size={20} />', content)
                content = re.sub(r'<MailIcon\s*/>', '<Mail size={20} />', content)
                content = re.sub(r'<UserIcon\s*/>', '<User size={20} />', content)
                content = re.sub(r'<KeyIcon\s*/>', '<Key size={20} />', content)
                content = re.sub(r'<CheckIcon\s*/>', '<Check size={20} />', content)
                content = re.sub(r'<XIcon\s*/>', '<X size={20} />', content)
                content = re.sub(r'<ArrowRightIcon\s*/>', '<ArrowRight size={20} />', content)
                content = re.sub(r'<ArrowLeftIcon\s*/>', '<ArrowLeft size={20} />', content)
                # Remove auth-page wrapper logic for line 359 (approx)
                content = content.replace('className="auth-page min-h-screen', 'className="min-h-screen')
                icons_needed.update(['Eye', 'EyeOff', 'Lock', 'Mail', 'User', 'Key', 'Check', 'X', 'ArrowRight', 'ArrowLeft'])
                modified = True

            if modified:
                content = inject_import(content, icons_needed)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
