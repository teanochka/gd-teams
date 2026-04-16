<template>
  <div class="container-fluid p-0 min-vh-100 d-flex flex-column">
    <header class="border-bottom bg-white p-3 d-flex justify-content-between align-items-center">
      <strong>GD Teams</strong>
      <div class="d-flex gap-2 align-items-center">
        <input class="form-control" placeholder="Поиск проектов" />
        <button class="btn btn-outline-secondary"><i class="bi bi-bell"></i></button>
        <button class="btn btn-primary">Создать проект</button>
        <div class="rounded-circle bg-dark text-white px-2 py-1 small">AM</div>
      </div>
    </header>
    <main class="flex-grow-1">
      <slot />
    </main>
  </div>
</template>
