import re

from .models import Node


DEFAULT_NODE_TITLES = {
    'folder': '\u041d\u043e\u0432\u0430\u044f \u043f\u0430\u043f\u043a\u0430',
    'document': '\u041d\u043e\u0432\u044b\u0439 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442',
    'canvas': '\u041d\u043e\u0432\u044b\u0439 \u0445\u043e\u043b\u0441\u0442',
    'template': '\u041d\u043e\u0432\u044b\u0439 \u0448\u0430\u0431\u043b\u043e\u043d',
}

TRAILING_NUMBER_RE = re.compile(r'^(?P<base>.*?)(?:\s+\((?P<number>\d+)\))?$')


def strip_number_suffix(title):
    match = TRAILING_NUMBER_RE.match(title.strip())
    if not match:
        return title.strip()

    return match.group('base').strip() or title.strip()


def make_unique_node_title(project_id, parent_id, desired_title, node_type, exclude_node_id=None):
    fallback_title = DEFAULT_NODE_TITLES.get(node_type, DEFAULT_NODE_TITLES['document'])
    base_title = strip_number_suffix((desired_title or '').strip() or fallback_title)
    query = Node.objects.filter(project_id=project_id, parent_id=parent_id, is_deleted=False)

    if exclude_node_id:
        query = query.exclude(id=exclude_node_id)

    taken_titles = {node.title.strip().casefold() for node in query}

    if base_title.casefold() not in taken_titles:
        return base_title

    suffix = 1
    while True:
        candidate = f'{base_title} ({suffix})'
        if candidate.casefold() not in taken_titles:
            return candidate
        suffix += 1
