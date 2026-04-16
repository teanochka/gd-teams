<script setup lang="ts">
const props = defineProps({
    title: String,
    description: String,
    imageUrl: String,
})
</script>

<template>
    <RouterLink to="/project">
        <BCard
        title="Card Title"
        img-src="https://picsum.photos/id/25/600/300"
        img-alt="Image"
        img-top
        tag="article"
        style="max-width: 20rem"
        >
        <BCardText>
            Some quick example text to build on the card title and make up the bulk of the card's content.
        </BCardText>
</BCard>
    </RouterLink>
</template>

<script lang="ts">
export default {
    props: {
        title: String,
        description: String,
        imageUrl: String,
    },
}
</script>
