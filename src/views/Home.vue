<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const movePortfolio = () => {
    router.push("/portfolio");
}
</script>

<template>
    <div class="home-container">
        <img src="/main.jpg" alt="홈 메인" @click="movePortfolio">
    </div>
</template>

<style scoped>
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.home-container img {
    height: 100vh;
    width: auto;
    object-fit: contain;
    cursor: pointer;
}

</style>