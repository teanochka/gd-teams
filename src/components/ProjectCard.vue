<script setup lang="ts">
const props = defineProps({
    title: String,
    date: String,
    imageUrl: String,
})
</script>

<template>
    <RouterLink to="/project">
        <BCard
            :title="props.title"
            :img-src="props.imageUrl"
            img-alt="Image"
            img-top
        >
            <BCardText>
                {{ props.date }}
            </BCardText>
        </BCard>
    </RouterLink>
</template>