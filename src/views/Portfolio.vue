<script setup>
import { ref, watch } from 'vue'

const selectedImage = ref(null)

const openModal = (imageSrc) => {
    selectedImage.value = imageSrc
}

const closeModal = () => {
    selectedImage.value = null
}

watch(selectedImage, (val) => {
    let style = "";
    
    if(val){
        style = "hidden";
    }

    document.body.style.overflow = style;
})
</script>

<template>
    <div class="portfolio-container">
        <div class="grid">
            <img src="/test1.jpg" alt="프로젝트 1" @click="openModal('/test1.jpg')">
            <img src="/test4.jpg" alt="프로젝트 4" @click="openModal('/test4.jpg')">
            <img src="/test2.jpg" alt="프로젝트 2" @click="openModal('/test2.jpg')">
            <img src="/test3.jpg" alt="프로젝트 3" @click="openModal('/test3.jpg')">
        </div>

        <!-- 상세 화면 (모달) -->
        <div v-if="selectedImage" class="modal" @click="closeModal">
             <div class="modal-image-wrapper">
                <img :src="selectedImage" class="modal-content">
                <div class="modal-overlay"></div>
            </div>
            <div class="overlay-content" @click.stop>
                <h2>프로젝트 상세 설명</h2>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <p>이 프로젝트에 대한 짧은 설명이 들어갈 수 있습니다.</p>
                <button @click="closeModal">닫기</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.portfolio-container {
    width: 80%;
    margin-left: auto;
    padding: 20px;
}

.grid {
    column-count: 2;
    gap: 15px;
}

.grid img {
    height: auto;
    width: 100%;
    border-radius: 10px;
}

.grid img:hover {
    transform: scale(1.05);
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-image-wrapper {
    position: relative;
    width: 80vw;
    height: 100vh;
    max-width: 1200px;
}

.modal-content {
    position: relative;
    width: 80vw;
    height: 100vh;
    max-width: 1200px;
    border-radius: 10px;
    object-fit: cover;
}

.overlay-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: black;
    font-size: 20px;
    font-weight: bold;
    z-index: 2;
    width: 70%;
    max-height: 60%;
    overflow: auto;
    padding: 15px;
    border-radius: 10px;
    overflow: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.overlay-content::-webkit-scrollbar {
    display: none;
}

.modal-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    z-index: 1;
}

</style>