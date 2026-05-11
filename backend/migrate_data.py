import json
import uuid
import datetime
from dateutil import parser
from mongoengine import connect
from api.models import Project, Team, Node, Tag, DocumentDraft

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return parser.isoparse(date_str)
    except:
        return None

def migrate():
    connect(db='gd_teams', host='mongodb://localhost:27017/gd_teams')
    
    with open('../db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Migrate Teams
    for t_data in data.get('teams', []):
        if not Team.objects(id=t_data['id']).first():
            team = Team(id=t_data['id'], name=t_data['name'])
            team.save()
            print(f"Migrated team: {team.name}")

    # Migrate Projects
    for p_data in data.get('projects', []):
        if not Project.objects(id=p_data['id']).first():
            project = Project(
                id=p_data['id'],
                title=p_data['title'],
                description=p_data.get('description', ''),
                created_at=parse_date(p_data.get('createdAt')),
                updated_at=parse_date(p_data.get('updatedAt')),
                created_by=p_data.get('owner'),
                team_id=p_data.get('teamId'),
                team_name=p_data.get('teamName'),
                image_url=p_data.get('imageUrl'),
                root_folder_id=p_data.get('rootFolderId'),
                files_count=p_data.get('filesCount', 0),
                is_favorite=p_data.get('isFavorite', False),
                is_deleted=p_data.get('isDeleted', False)
            )
            project.save()
            print(f"Migrated project: {project.title}")

    # Migrate Tags
    for t_data in data.get('tags', []):
        if not Tag.objects(id=t_data['id']).first():
            tag = Tag(
                id=t_data['id'],
                project_id=t_data['projectId'],
                name=t_data['name'],
                color=t_data['color']
            )
            tag.save()
            print(f"Migrated tag: {tag.name}")

    # Migrate Nodes
    for n_data in data.get('nodes', []):
        if not Node.objects(id=n_data['id']).first():
            node = Node(
                id=n_data['id'],
                project_id=n_data['projectId'],
                parent_id=n_data.get('parentId'),
                type=n_data['type'],
                title=n_data['title'],
                icon=n_data.get('icon'),
                tag_ids=n_data.get('tagIds', []),
                is_favorite=n_data.get('isFavorite', False),
                is_deleted=n_data.get('isDeleted', False),
                created_at=parse_date(n_data.get('createdAt')),
                created_by=n_data.get('createdBy'),
                updated_at=parse_date(n_data.get('updatedAt')),
                updated_by=n_data.get('updatedBy')
            )
            node.save()
            print(f"Migrated node: {node.title}")

    # Migrate Documents
    for d_data in data.get('documents', []):
        if not DocumentDraft.objects(id=d_data['id']).first():
            draft = DocumentDraft(
                id=d_data['id'],
                node_id=d_data['nodeId'],
                blocks=d_data.get('page', {}).get('blocks', [])
            )
            draft.save()
            print(f"Migrated document draft for node: {draft.node_id}")

if __name__ == "__main__":
    try:
        migrate()
        print("Migration completed successfully!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Migration failed: {e}")
