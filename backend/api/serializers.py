from rest_framework import serializers
from .models import User, Project, Team, Tag, Node, DocumentPage, CanvasDraft, ProjectRole, ProjectMember, KanbanBoard

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'email', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class ProjectRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRole
        fields = ['id', 'name', 'color', 'permissions', 'is_user_specific']

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    roles = ProjectRoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=ProjectRole.objects.all(), source='roles', many=True, write_only=True, required=False
    )

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_id', 'roles', 'role_ids', 'is_owner']

class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)
    owner = serializers.SerializerMethodField()
    teamId = serializers.CharField(source='id', read_only=True)
    teamName = serializers.CharField(source='title', read_only=True)
    name = serializers.CharField(source='title', read_only=True)
    count = serializers.IntegerField(source='files_count', read_only=True)
    
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    filesCount = serializers.IntegerField(source='files_count', required=False, default=0)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True, allow_null=True)
    rootFolderId = serializers.CharField(source='root_folder_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'createdAt', 'updatedAt', 'owner', 'teamId', 'teamName', 'name', 'count', 'isFavorite', 'isDeleted', 'filesCount', 'imageUrl', 'rootFolderId']

    def get_owner(self, obj):
        if obj.created_by:
            return obj.created_by.display_name or obj.created_by.username
        return "Unknown"

class TeamSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = Team
        fields = ['id', 'name']

class TagSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all())
    
    class Meta:
        model = Tag
        fields = ['id', 'projectId', 'name', 'color']

class NodeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all())
    parentId = serializers.CharField(source='parent_id', allow_null=True, required=False)
    tagIds = serializers.JSONField(source='tag_ids', required=False, default=list)
    isFavorite = serializers.BooleanField(source='is_favorite', required=False, default=False)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    createdBy = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)
    updatedBy = serializers.SerializerMethodField()
    deletedAt = serializers.DateTimeField(source='deleted_at', required=False, allow_null=True, read_only=True)
    deletedBy = serializers.CharField(source='deleted_by', required=False, allow_null=True, read_only=True)

    class Meta:
        model = Node
        fields = ['id', 'projectId', 'parentId', 'type', 'title', 'icon', 'tagIds', 'isFavorite', 'isDeleted', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy']

    def get_createdBy(self, obj):
        if obj.created_by:
            return obj.created_by.display_name or obj.created_by.username
        return "Unknown"

    def get_updatedBy(self, obj):
        if obj.updated_by:
            return obj.updated_by.display_name or obj.updated_by.username
        return "Unknown"

class DocumentPageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.PrimaryKeyRelatedField(source='node', queryset=Node.objects.all())
    projectId = serializers.CharField(source='project_id', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)

    class Meta:
        model = DocumentPage
        fields = ['id', 'nodeId', 'projectId', 'page', 'createdAt', 'updatedAt']

class CanvasDraftSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    nodeId = serializers.PrimaryKeyRelatedField(source='node', queryset=Node.objects.all())
    
    class Meta:
        model = CanvasDraft
        fields = ['id', 'nodeId', 'elements']

class KanbanBoardSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all())
    createdAt = serializers.DateTimeField(source='created_at', required=False, read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', required=False, read_only=True)
    taskTypes = serializers.JSONField(source='task_types')

    class Meta:
        model = KanbanBoard
        fields = ['id', 'projectId', 'members', 'roles', 'taskTypes', 'priorities', 'statuses', 'tags', 'columns', 'createdAt', 'updatedAt']
