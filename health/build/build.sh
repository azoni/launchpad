#!/usr/bin/env bash
# Inline build/health_data.json into build/dashboard_template.html -> public/index.html
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
tpl = open('dashboard_template.html').read()
data = open('health_data.json').read()
open('../public/index.html', 'w').write(tpl.replace('__HEALTH_DATA__', data))
print('wrote public/index.html')
PY
