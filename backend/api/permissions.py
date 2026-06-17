from rest_framework import permissions
from .models import Project, ProjectMember, ProjectRole, Node

def check_permission(user, project, action, node_id=None):
    """
    Проверяет наличие прав у пользователя на выполнение действия в проекте.
    action: 'create', 'edit', 'delete', 'manage_members', 'manage_roles'
    node_id: опционально, для проверки прав на конкретный узел (папка/документ)
    """
    if not user.is_authenticated:
        return False
    
    # 1. Проверяем членство в проекте
    try:
        member = ProjectMember.objects.get(user=user, project=project)
    except ProjectMember.DoesNotExist:
        return False
    
    # Владелец может всё
    if member.is_owner or member.access_level == 'admin':
        return True
    
    # Модератор может управлять участниками и контентом, но не ролями (для примера)
    if member.access_level == 'moderator':
        if action in ['create', 'edit', 'delete', 'manage_members']:
            return True
        return False
    
    # Пользователь может только создавать и редактировать контент
    if member.access_level == 'user':
        if action in ['create', 'edit']:
            return True
        return False
    
    return False

class IsProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj if isinstance(obj, Project) else getattr(obj, 'project', None)
        if not project:
            return True
        return ProjectMember.objects.filter(user=request.user, project=project).exists()
