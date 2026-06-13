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
    if member.is_owner:
        return True
    
    # 2. Собираем все роли
    roles = member.roles.all()
    
    # 3. Если есть node_id, проверяем иерархию (рекурсивно вверх)
    if node_id:
        current_node_id = node_id
        while current_node_id:
            try:
                node = Node.objects.get(id=current_node_id)
            except Node.DoesNotExist:
                break
                
            for role in roles:
                perms = role.permissions
                if node.id in perms.get(f'allow_{action}', []):
                    return True
            
            current_node_id = node.parent_id
    
    # 4. Проверяем глобальные права ролей проекта
    for role in roles:
        if role.permissions.get(f'can_{action}', False):
            return True
            
    return False

class IsProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj if isinstance(obj, Project) else getattr(obj, 'project', None)
        if not project:
            return True
        return ProjectMember.objects.filter(user=request.user, project=project).exists()
