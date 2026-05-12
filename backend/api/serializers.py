from rest_framework import serializers
from .models import Project, Team, Tag, Node, DocumentPage, CanvasDraft

class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)
    owner = serializers.CharField(source='created_by', required=False, allow_blank=True, allow_null=True)
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)
    teamName = serializers.CharField(source='team_name', required=False, allow_blank=True, allow_null=True)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    filesCount = serializers.IntegerField(source='files_count', required=False, default=0)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True, allow_null=True)
    rootFolderId = serializers.CharField(source='root_folder_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'createdAt', 'updatedAt', 'owner', 'teamId', 'teamName', 'isFavorite', 'isDeleted', 'filesCount', 'imageUrl', 'rootFolderId']

class TeamSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = Team
        fields = ['id', 'name']

class TagSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    projectId = serializers.CharField(source='project_id')
    
    class Meta:
        model = Tag
        fields = ['id', 'projectId', 'name', 'color']

class NodeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    projectId = serializers.CharField(source='project_id')
    parentId = serializers.CharField(source='parent_id', allow_null=True, required=False)
    tagIds = serializers.JSONField(source='tag_ids', required=False, default=list)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    createdBy = serializers.CharField(source='created_by', required=False, allow_blank=True, allow_null=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)
    updatedBy = serializers.CharField(source='updated_by', required=False, allow_blank=True, allow_null=True)
    deletedAt = serializers.DateTimeField(source='deleted_at', required=False, allow_null=True, read_only=True)
    deletedBy = serializers.CharField(source='deleted_by', required=False, allow_null=True, read_only=True)

    class Meta:
        model = Node
        fields = ['id', 'projectId', 'parentId', 'type', 'title', 'icon', 'tagIds', 'isFavorite', 'isDeleted', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy']

class DocumentPageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.CharField(source='node_id')
    projectId = serializers.CharField(source='project_id', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)

    class Meta:
        model = DocumentPage
        fields = ['id', 'nodeId', 'projectId', 'page', 'createdAt', 'updatedAt']

class CanvasDraftSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.CharField(source='node_id')
    
    class Meta:
        model = CanvasDraft
        fields = ['id', 'nodeId', 'elements']