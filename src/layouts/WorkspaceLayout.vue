<template>
  <div class="container-fluid p-0 min-vh-100 d-flex flex-column bg-body-tertiary">
    <header class="border-bottom bg-white p-3">
      <slot name="topbar" />
    </header>
    <main class="flex-grow-1">
      <slot />
    </main>
  </div>
</template>
