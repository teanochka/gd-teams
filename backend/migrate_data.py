import os
import sys
import json
import django
import uuid
from dateutil import parser

# --- Шаг 1: Настройка окружения Django ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# --- Шаг 2: Импорт моделей ---
from api.models import User, Project, Team, Node, Tag, DocumentPage, CanvasPage, CanvasDraft, ProjectMember
from django.utils import timezone
from django.contrib.auth.hashers import make_password

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return parser.isoparse(date_str)
    except (ValueError, TypeError):
        return None

def migrate():
    db_path = '../db.json'
    if not os.path.exists(db_path):
        db_path = 'db.json'
        if not os.path.exists(db_path):
            print(f"ОШИБКА: Файл db.json не найден!")
            return

    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("Начинаем миграцию данных в новую схему...")

    # --- 1. Создание пользователей ---
    usernames = set()
    for p in data.get('projects', []): usernames.add(p.get('owner'))
    for n in data.get('nodes', []): usernames.add(n.get('createdBy'))
    
    user_map = {}
    
    print("Создание пользователей...")
    for uname in usernames:
        if not uname: continue
        clean_uname = uname.replace(' ', '_').lower()
        user, created = User.objects.get_or_create(
            username=clean_uname,
            defaults={
                'display_name': uname,
                'password': make_password('password123'),
                'email': f"{clean_uname}@example.com"
            }
        )
        user_map[uname] = user
        if created:
            print(f"  [OK] User created: {uname}")

    # --- 2. Миграция проектов ---
    print("Миграция проектов...")
    project_map = {}
    for p_data in data.get('projects', []):
        owner = user_map.get(p_data.get('owner'))
        project, created = Project.objects.get_or_create(
            id=p_data['id'], 
            defaults={
                'title': p_data['title'],
                'description': p_data.get('description', ''),
                'created_at': parse_date(p_data.get('createdAt')) or timezone.now(),
                'updated_at': parse_date(p_data.get('updatedAt')) or timezone.now(),
                'created_by': owner,
                'image_url': p_data.get('imageUrl', ''),
                'root_folder_id': p_data.get('rootFolderId', ''),
                'files_count': p_data.get('filesCount', 0),
                'is_favorite': p_data.get('isFavorite', False),
                'is_deleted': p_data.get('isDeleted', False)
            }
        )
        project_map[project.id] = project
        
        if created and owner:
            ProjectMember.objects.get_or_create(
                user=owner, 
                project=project, 
                defaults={'is_owner': True, 'access_level': 'admin'}
            )
            print(f"  [OK] Project migrated: {project.title}")

    # --- 3. Миграция тегов ---
    print("Миграция тегов...")
    for t_data in data.get('tags', []):
        project = project_map.get(t_data['projectId'])
        if not project: continue
        Tag.objects.get_or_create(
            id=t_data['id'], 
            defaults={
                'project': project,
                'name': t_data['name'],
                'color': t_data.get('color', {})
            }
        )

    # --- 4. Миграция узлов ---
    print("Миграция узлов (папки, документы)...")
    node_map = {}
    for n_data in data.get('nodes', []):
        project = project_map.get(n_data['projectId'])
        if not project: continue
        
        creator = user_map.get(n_data.get('createdBy'))
        updater = user_map.get(n_data.get('updatedBy'))
        
        node, created = Node.objects.get_or_create(
            id=n_data['id'], 
            defaults={
                'project': project,
                'parent_id': n_data.get('parentId'),
                'type': n_data['type'],
                'title': n_data['title'],
                'icon': n_data.get('icon', ''),
                'tag_ids': n_data.get('tagIds', []),
                'is_favorite': n_data.get('isFavorite', False),
                'is_deleted': n_data.get('isDeleted', False),
                'created_at': parse_date(n_data.get('createdAt')) or timezone.now(),
                'created_by': creator,
                'updated_at': parse_date(n_data.get('updatedAt')) or timezone.now(),
                'updated_by': updater
            }
        )
        node_map[node.id] = node

    # --- 5. Миграция контента ---
    print("Миграция контента...")
    for d_data in data.get('documents', []):
        node = node_map.get(d_data['nodeId'])
        if not node: continue
        DocumentPage.objects.get_or_create(
            node=node,
            defaults={
                'id': d_data['id'],
                'project_id': d_data.get('projectId'),
                'page': d_data.get('page', {})
            }
        )

    for c_data in data.get('canvasPages', []):
        node = node_map.get(c_data['nodeId'])
        if not node: continue
        CanvasPage.objects.get_or_create(
            node=node,
            defaults={
                'id': c_data['id'],
                'project_id': c_data.get('projectId'),
                'data': c_data.get('data', {}),
                'created_at': parse_date(c_data.get('createdAt')) or timezone.now(),
                'updated_at': parse_date(c_data.get('updatedAt')) or timezone.now()
            }
        )
        CanvasDraft.objects.get_or_create(
            node=node,
            defaults={
                'id': c_data['id'] + '-draft',
                'elements': c_data.get('data', {}).get('elements', [])
            }
        )
    
    print("\nМиграция успешно завершена!")

if __name__ == "__main__":
    migrate()
