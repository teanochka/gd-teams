import uuid
from django.db import models
from django.utils import timezone

def generate_id():
    return str(uuid.uuid4())

class Project(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    banner = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=255, blank=True, null=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    team_name = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    root_folder_id = models.CharField(max_length=50, blank=True, null=True)
    files_count = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'projects'

class Team(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'teams'

class Tag(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project_id = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    color = models.JSONField(default=dict)

    class Meta:
        db_table = 'tags'

class Node(models.Model):
    TYPE_CHOICES = [
        ('folder', 'folder'),
        ('document', 'document'),
        ('canvas', 'canvas'),
        ('template', 'template'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project_id = models.CharField(max_length=50)
    parent_id = models.CharField(max_length=50, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=255, null=True, blank=True)
    tag_ids = models.JSONField(default=list, blank=True)
    
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(default=timezone.now)
    updated_by = models.CharField(max_length=255, blank=True, null=True)
    
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'nodes'

class DocumentPage(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    node_id = models.CharField(max_length=50, unique=True)
    project_id = models.CharField(max_length=50, null=True, blank=True)
    page = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'document_pages'

class CanvasDraft(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    node_id = models.CharField(max_length=50, unique=True)
    elements = models.JSONField(default=list)

    class Meta:
        db_table = 'canvas_drafts'