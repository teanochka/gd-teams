import os
import sys
import django

# --- Setup Django ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import ProjectMember

def update_owners():
    print("Updating access_level for owners...")
    owners = ProjectMember.objects.filter(is_owner=True)
    updated_count = owners.update(access_level='admin')
    print(f"Updated {updated_count} owners to 'admin' access level.")

if __name__ == "__main__":
    update_owners()
