<script setup>
import { ref, watch } from 'vue'

const generateUrlData = (data) => {
    const result = [];
    const len = data.length;

    for(let i = 0; i < len; i++){
        const sub = [];

        for(let j = 1; j <= data[i].subCount; j++){
            sub.push(`${data[i].root}/sub${j}.jpg`);
        }
        result.push({main: `${data[i].root}/main.jpg`, sub});
    }

    return result;
}

const urlData = generateUrlData([
    {root: "portfolio1", subCount: 3},
    {root: "portfolio2", subCount: 3},
    {root: "portfolio3", subCount: 4},
    {root: "portfolio4", subCount: 3},
    {root: "portfolio5", subCount: 1},
    {root: "portfolio6", subCount: 1},
]);

const BASE_URL = import.meta.env.BASE_URL;
const selectedImage = ref(null);

const openModal = (imageSrc) => {
    selectedImage.value = imageSrc;
}

const closeModal = () => {
    selectedImage.value = null;
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
            <template v-for="item in urlData" :key="item.main">
                <img :src="item.main" alt="프로젝트 이미지" @click="openModal(item.main)">
            </template>
        </div>

        <!-- 상세 화면 (모달) -->
        <div v-if="selectedImage" class="modal" @click="closeModal">
             <div class="modal-image-wrapper">
                 <img :src="BASE_URL + selectedImage" class="modal-content">
                 <button class="close-button" @click="closeModal">X</button>
                <div class="modal-overlay"></div>
            </div>
            <div class="overlay-content" @click.stop>
                <div class="sub-images">
                    <template v-for="subImg in urlData.find(item => item.main === selectedImage)?.sub" :key="subImg">
                        <img :src="subImg" alt="서브 이미지" class="sub-image">
                    </template>
                </div>

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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.grid img {
    height: auto;
    width: 100%;
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
    width: 90vw;
    height: 100vh;
    max-width: 1600px;
}

.modal-content {
    position: relative;
    width: 90vw;
    height: 100vh;
    max-width: 1600px;
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
    width: 80%;
    max-height: 90%;
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
    z-index: 1;
}

.sub-image {
    width: 100%;
    height: auto;
    transition: transform 0.3s;
}

.close-button {
    position: absolute;
    top: 5px;
    right: 20px;
    font-size: 24px;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.3s ease
}

.close-button:hover {
    transform: scale(1.2);
}

</style>