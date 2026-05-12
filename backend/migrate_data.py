import os
import sys
import json
import django
from dateutil import parser

# --- Шаг 1: Настройка окружения Django ---
# Это позволяет скрипту использовать модели и подключаться к базе данных
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# --- Шаг 2: Импорт моделей (только после django.setup()) ---
from api.models import Project, Team, Node, Tag, DocumentPage, CanvasDraft
from django.utils import timezone

def parse_date(date_str):
    """Безопасно преобразует строку ISO в объект datetime."""
    if not date_str:
        return None
    try:
        # isoparse более строгий и правильный для ISO 8601 формата
        return parser.isoparse(date_str)
    except (ValueError, TypeError):
        return None

def migrate():
    """Основная функция для переноса данных из db.json в PostgreSQL."""
    
    # --- Шаг 3: Проверка наличия db.json ---
    db_path = 'db.json'
    if not os.path.exists(db_path):
        print(f"ОШИБКА: Файл {db_path} не найден!")
        print("Пожалуйста, поместите ваш файл 'db.json' в ту же папку, где лежит этот скрипт.")
        return

    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("Начинаем миграцию данных из db.json в PostgreSQL...")

    # --- Миграция команд (Teams) ---
    for t_data in data.get('teams', []):
        team, created = Team.objects.get_or_create(
            id=t_data['id'], 
            defaults={'name': t_data['name']}
        )
        if created:
            print(f"  [OK] Migrated team: {team.name}")

    # --- Миграция проектов (Projects) ---
    for p_data in data.get('projects', []):
        project, created = Project.objects.get_or_create(
            id=p_data['id'], 
            defaults={
                'title': p_data['title'],
                'description': p_data.get('description', ''),
                'created_at': parse_date(p_data.get('createdAt')) or timezone.now(),
                'updated_at': parse_date(p_data.get('updatedAt')) or timezone.now(),
                'created_by': p_data.get('owner', ''),
                'team_id': p_data.get('teamId', ''),
                'team_name': p_data.get('teamName', ''),
                'image_url': p_data.get('imageUrl', ''),
                'root_folder_id': p_data.get('rootFolderId', ''),
                'files_count': p_data.get('filesCount', 0),
                'is_favorite': p_data.get('isFavorite', False),
                'is_deleted': p_data.get('isDeleted', False)
            }
        )
        if created:
            print(f"  [OK] Migrated project: {project.title}")

    # --- Миграция тегов (Tags) ---
    for t_data in data.get('tags', []):
        tag, created = Tag.objects.get_or_create(
            id=t_data['id'], 
            defaults={
                'project_id': t_data['projectId'],
                'name': t_data['name'],
                'color': t_data.get('color', {})
            }
        )
        if created:
            print(f"  [OK] Migrated tag: {tag.name}")

    # --- Миграция узлов (Nodes: папки, документы, и т.д.) ---
    for n_data in data.get('nodes', []):
        node, created = Node.objects.get_or_create(
            id=n_data['id'], 
            defaults={
                'project_id': n_data['projectId'],
                'parent_id': n_data.get('parentId'),
                'type': n_data['type'],
                'title': n_data['title'],
                'icon': n_data.get('icon', ''),
                'tag_ids': n_data.get('tagIds', []),
                'is_favorite': n_data.get('isFavorite', False),
                'is_deleted': n_data.get('isDeleted', False),
                'created_at': parse_date(n_data.get('createdAt')) or timezone.now(),
                'created_by': n_data.get('createdBy', ''),
                'updated_at': parse_date(n_data.get('updatedAt')) or timezone.now(),
                'updated_by': n_data.get('updatedBy', '')
            }
        )
        if created:
            print(f"  [OK] Migrated node: {node.title}")

    # --- Миграция контента документов (DocumentPages) ---
    for d_data in data.get('documents', []):
        page_content = d_data.get('page', {'blocks': []})
        doc, created = DocumentPage.objects.get_or_create(
            id=d_data['id'], 
            defaults={
                'node_id': d_data['nodeId'],
                'page': page_content
            }
        )
        if created:
            print(f"  [OK] Migrated document content for node: {doc.node_id}")

    # --- Миграция контента канвасов (CanvasDrafts) ---
    for c_data in data.get('canvases', []):
        canvas, created = CanvasDraft.objects.get_or_create(
            id=c_data['id'],
            defaults={
                'node_id': c_data['nodeId'],
                'elements': c_data.get('elements', [])
            }
        )
        if created:
            print(f"  [OK] Migrated canvas content for node: {canvas.node_id}")
    
    print("\nМиграция данных успешно завершена!")

# --- Шаг 4: Запуск скрипта ---
if __name__ == "__main__":
    migrate()