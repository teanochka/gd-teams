from mongoengine import Document, StringField, BooleanField, DateTimeField, ListField, ReferenceField, DictField, DynamicField, IntField
import datetime
import uuid

class Project(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    title = StringField(required=True)
    description = StringField()
    banner = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)
    created_by = StringField()
    team_id = StringField()
    team_name = StringField()
    image_url = StringField()
    root_folder_id = StringField()
    files_count = IntField(default=0)
    is_favorite = BooleanField(default=False)
    is_deleted = BooleanField(default=False)

    meta = {'collection': 'projects'}

class Team(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    name = StringField(required=True)

    meta = {'collection': 'teams'}

class Tag(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = StringField(required=True)
    name = StringField(required=True)
    color = DynamicField() # Can be hex string or dict

    meta = {'collection': 'tags'}

class Node(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = StringField(required=True)
    parent_id = StringField(null=True)
    type = StringField(required=True, choices=['folder', 'document', 'canvas', 'template'])
    
    title = StringField(required=True)
    icon = StringField(null=True)
    tag_ids = ListField(StringField(), default=list)
    
    is_favorite = BooleanField(default=False)
    is_deleted = BooleanField(default=False)
    
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    created_by = StringField()
    updated_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_by = StringField()
    
    deleted_at = DateTimeField(null=True)
    deleted_by = StringField(null=True)

    meta = {'collection': 'nodes'}

class DocumentPage(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    node_id = StringField(required=True)
    project_id = StringField()
    page = DictField() # LotionPage: name, coverUrl, blocks, card
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'document_pages'}

class CanvasDraft(Document):
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    node_id = StringField(required=True)
    elements = ListField(DynamicField(), default=list)

    meta = {'collection': 'canvas_drafts'}
