from rest_framework import serializers

class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', required=False)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False)
    owner = serializers.CharField(source='created_by', required=False, allow_blank=True)
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True)
    teamName = serializers.CharField(source='team_name', required=False, allow_blank=True)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    filesCount = serializers.IntegerField(source='files_count', required=False, default=0)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True)
    rootFolderId = serializers.CharField(source='root_folder_id', required=False, allow_blank=True)

class TeamSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    name = serializers.CharField(required=True)

class TagSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    projectId = serializers.CharField(source='project_id', required=True)
    name = serializers.CharField(required=True)
    color = serializers.JSONField() # Can be dict or string

class NodeSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    projectId = serializers.CharField(source='project_id', required=True)
    parentId = serializers.CharField(source='parent_id', allow_null=True, required=False)
    type = serializers.ChoiceField(choices=['folder', 'document', 'canvas', 'template'])
    title = serializers.CharField(required=True)
    icon = serializers.CharField(allow_null=True, required=False)
    tagIds = serializers.ListField(source='tag_ids', child=serializers.CharField(), required=False, default=list)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    createdAt = serializers.DateTimeField(source='created_at', required=False)
    createdBy = serializers.CharField(source='created_by', required=False, allow_blank=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False)
    updatedBy = serializers.CharField(source='updated_by', required=False, allow_blank=True)
    deletedAt = serializers.DateTimeField(source='deleted_at', required=False, allow_null=True)
    deletedBy = serializers.CharField(source='deleted_by', required=False, allow_null=True)

class DocumentPageSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.CharField(source='node_id', required=True)
    projectId = serializers.CharField(source='project_id', required=False)
    page = serializers.DictField(required=True)
    createdAt = serializers.DateTimeField(source='created_at', required=False)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False)

class CanvasDraftSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.CharField(source='node_id', required=True)
    elements = serializers.ListField(child=serializers.JSONField(), required=False, default=list)
