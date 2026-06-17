import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

def generate_id():
    return str(uuid.uuid4())

class User(AbstractUser):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    display_name = models.CharField(max_length=255, blank=True, null=True)
    secret_word = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'users'

class Project(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    banner = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    
    image_url = models.TextField(blank=True, null=True)
    root_folder_id = models.CharField(max_length=50, blank=True, null=True)
    files_count = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'projects'

class ProjectRole(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='roles', null=True)
    name = models.CharField(max_length=255)
    color = models.JSONField(default=dict)
    permissions = models.JSONField(default=dict)
    is_user_specific = models.BooleanField(default=False)

    class Meta:
        db_table = 'project_roles'

class ProjectMember(models.Model):
    ACCESS_LEVEL_CHOICES = [
        ('admin', 'Администратор'),
        ('moderator', 'Модератор'),
        ('user', 'Пользователь'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members', null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships', null=True)
    roles = models.ManyToManyField(ProjectRole, blank=True)
    is_owner = models.BooleanField(default=False)
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='user')

    def save(self, *args, **kwargs):
        if self.is_owner or (self.project and self.project.created_by == self.user):
            self.is_owner = True
            self.access_level = 'admin'
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'project_members'
        unique_together = ('project', 'user')

class Team(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'teams'

class Tag(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tags', null=True)
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
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='nodes', null=True)
    parent_id = models.CharField(max_length=50, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=255, null=True, blank=True)
    tag_ids = models.JSONField(default=list, blank=True)
    
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_nodes')
    updated_at = models.DateTimeField(default=timezone.now)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_nodes')
    
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'nodes'

class DocumentPage(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    node = models.OneToOneField(Node, on_delete=models.CASCADE, related_name='document_page', null=True)
    project_id = models.CharField(max_length=50, null=True, blank=True)
    page = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'document_pages'

class CanvasPage(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    node = models.OneToOneField(Node, on_delete=models.CASCADE, related_name='canvas_page', null=True)
    project_id = models.CharField(max_length=50, null=True, blank=True)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'canvas_pages'

class CanvasDraft(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    node = models.OneToOneField(Node, on_delete=models.CASCADE, related_name='canvas_draft', null=True)
    elements = models.JSONField(default=list)

    class Meta:
        db_table = 'canvas_drafts'

class KanbanBoard(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='kanban_boards')
    members = models.JSONField(default=list)
    roles = models.JSONField(default=list)
    task_types = models.JSONField(default=list)
    priorities = models.JSONField(default=list)
    statuses = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    columns = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'kanban_boards'

class Channel(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_channels')

    class Meta:
        db_table = 'channels'

class ChatMessage(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=generate_id)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='chat_messages')
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
