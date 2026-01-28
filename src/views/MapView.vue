<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const mapContainer = ref(null);
const searchKeyword = ref('');
const radius = ref(1000); // 기본 반경 1km
const results = ref([]);
const categories = ref([
    { name: '전시회', value: '전시회', color: '#FF6B6B' },
    { name: '미술관', value: '미술관', color: '#4ECDC4' },
    { name: '박물관', value: '박물관', color: '#FFE66D' },
    { name: '공연장', value: '공연장', color: '#1A535C' }
]);
const selectedCategories = ref(['전시회', '미술관']);
const currentCenter = ref(null);

let map = null;
let ps = null;
let markers = [];
let centerMarker = null;

onMounted(() => {
    // 카카오맵 초기화
    if (window.kakao && window.kakao.maps) {
        const options = {
            center: new kakao.maps.LatLng(37.566826, 126.9786567), // 서울 시청 기준
            level: 3
        };
        map = new kakao.maps.Map(mapContainer.value, options);
        ps = new kakao.maps.services.Places();
    } else {
        console.error('카카오맵 라이브러리를 로드할 수 없습니다.');
    }
});

const toggleCategory = (value) => {
    const index = selectedCategories.value.indexOf(value);
    if (index > -1) {
        if (selectedCategories.value.length > 1) {
            selectedCategories.value.splice(index, 1);
        } else {
            alert('최소 하나 이상의 카테고리를 선택해야 합니다.');
        }
    } else {
        selectedCategories.value.push(value);
    }
    if (currentCenter.value) {
        searchPlacesByCategories(currentCenter.value);
    }
};

const searchLocation = () => {
    if (!searchKeyword.value.trim()) {
        alert('검색어를 입력하세요.');
        return;
    }

    ps.keywordSearch(searchKeyword.value, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const firstPlace = data[0];
            const center = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);
            
            currentCenter.value = center;
            map.setCenter(center);
            
            // 중심 위치 마커 표시
            displayCenterMarker(center, firstPlace.place_name);
            searchPlacesByCategories(center);
        } else {
            alert('위치를 찾을 수 없습니다.');
        }
    });
};

const displayCenterMarker = (position, title) => {
    if (centerMarker) {
        centerMarker.setMap(null);
    }

    // 커스텀 이미지 사용 (중심점 구분용)
    const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; 
    const imageSize = new kakao.maps.Size(24, 35); 
    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    centerMarker = new kakao.maps.Marker({
        map: map,
        position: position,
        title: title,
        image: markerImage,
        zIndex: 10
    });

    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;font-weight:bold;color:blue;">검색 위치: ${title}</div>`
    });
    infowindow.open(map, centerMarker);
};

const searchPlacesByCategories = async (center) => {
    removeMarkers();
    results.value = [];
    
    const allResults = [];
    const searchPromises = selectedCategories.value.map(category => {
        return new Promise((resolve) => {
            ps.keywordSearch(category, (data, status) => {
                if (status === kakao.maps.services.Status.OK) {
                    const filtered = data.filter(place => {
                        const placeLatLng = new kakao.maps.LatLng(place.y, place.x);
                        const poly = new kakao.maps.Polyline({
                            path: [center, placeLatLng]
                        });
                        const distance = poly.getLength();
                        place.distance = Math.round(distance);
                        place.category_tag = category; // 검색된 카테고리 태그 추가
                        return distance <= radius.value;
                    });
                    resolve(filtered);
                } else {
                    resolve([]);
                }
            }, {
                location: center,
                radius: radius.value
            });
        });
    });

    const promiseResults = await Promise.all(searchPromises);
    promiseResults.forEach(res => allResults.push(...res));

    // 중복 제거 및 거리순 정렬
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    results.value = uniqueResults.sort((a, b) => a.distance - b.distance);

    results.value.forEach(place => {
        displayMarker(place);
    });
};

const displayMarker = (place) => {
    const marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x)
    });
    markers.push(marker);

    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;color:black;">[${place.category_tag}] ${place.place_name}</div>`
    });

    kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(map, marker);
    });

    kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
    });
    
    kakao.maps.event.addListener(marker, 'click', () => {
        selectPlace(place);
    });
};

const removeMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
};

const selectPlace = (place) => {
    const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
    map.panTo(moveLatLon);
};

const closeMap = () => {
    router.push('/portfolio');
};

const getCategoryColor = (tagName) => {
    const cat = categories.value.find(c => c.value === tagName);
    return cat ? cat.color : '#4a90e2';
};
</script>

<template>
    <div class="map-page">
        <div class="map-container" ref="mapContainer"></div>
        
        <div class="sidebar">
            <div class="search-section">
                <div class="header-row">
                    <h2>전시/문화 맵</h2>
                    <button class="close-btn" @click="closeMap" title="포트폴리오로 돌아가기">
                        <span class="close-icon">×</span>
                    </button>
                </div>
                <div class="input-group">
                    <input 
                        v-model="searchKeyword" 
                        @keyup.enter="searchLocation"
                        placeholder="중심 위치 입력 (예: 강남역)" 
                    />
                    <button @click="searchLocation" class="main-btn">검색</button>
                </div>

                <div class="filter-group">
                    <label>카테고리 다중 선택</label>
                    <div class="category-tags">
                        <span 
                            v-for="cat in categories" 
                            :key="cat.value"
                            class="tag-pill"
                            :class="{ active: selectedCategories.includes(cat.value) }"
                            :style="{ '--active-color': cat.color }"
                            @click="toggleCategory(cat.value)"
                        >
                            {{ cat.name }}
                        </span>
                    </div>
                </div>

                <div class="filter-group">
                    <div class="label-row">
                        <label>반경 설정</label>
                        <span class="radius-val">{{ radius }}m</span>
                    </div>
                    <input type="range" v-model.number="radius" min="500" max="5000" step="500" @change="searchLocation" />
                </div>
            </div>

            <div class="results-section">
                <div v-if="results.length === 0" class="no-results">
                    {{ currentCenter ? '검색 결과가 없습니다.' : '위치를 검색해 보세요.' }}
                </div>
                <div 
                    v-for="place in results" 
                    :key="place.id" 
                    class="place-item"
                    @click="selectPlace(place)"
                >
                    <div class="place-header">
                        <span 
                            class="cate-badge" 
                            :style="{ backgroundColor: getCategoryColor(place.category_tag) }"
                        >
                            {{ place.category_tag }}
                        </span>
                        <h3>{{ place.place_name }}</h3>
                    </div>
                    <p class="addr">{{ place.address_name }}</p>
                    <div class="place-footer">
                        <span class="distance">📍 {{ place.distance }}m</span>
                        <a :href="place.place_url" target="_blank" class="detail-link" @click.stop>상세보기</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.map-page {
    display: flex;
    height: calc(100vh - 40px);
    background: #0f0f0f;
    color: white;
    border-radius: 24px;
    overflow: hidden;
    margin-top: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.map-container {
    flex: 1;
    height: 100%;
}

.sidebar {
    width: 380px;
    background: #181818;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #2a2a2a;
}

.search-section {
    padding: 24px;
    background: #212121;
    border-bottom: 2px solid #2a2a2a;
}

.search-section h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(45deg, #4a90e2, #63b3ed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.close-btn {
    background: #2a2a2a;
    border: none;
    color: #888;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #333;
    color: white;
    transform: rotate(90deg);
}

.close-icon {
    font-size: 24px;
    line-height: 1;
}

.input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.input-group input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #333;
    background: #121212;
    color: white;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.3s;
}

.input-group input:focus {
    border-color: #4a90e2;
}

.main-btn {
    padding: 0 20px;
    border-radius: 12px;
    border: none;
    background: #4a90e2;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, background 0.3s;
}

.main-btn:hover {
    background: #357abd;
    transform: scale(1.05);
}

.filter-group {
    margin-bottom: 18px;
}

.filter-group label {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 8px;
    font-weight: 600;
}

.category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-pill {
    padding: 6px 14px;
    border-radius: 20px;
    background: #2a2a2a;
    color: #aaa;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

.tag-pill:hover {
    background: #333;
    color: white;
}

.tag-pill.active {
    background: var(--active-color);
    color: white;
    font-weight: 600;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.radius-val {
    color: #4a90e2;
    font-weight: bold;
    font-size: 0.85rem;
}

.results-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #181818;
}

.place-item {
    padding: 20px;
    background: #212121;
    border-radius: 16px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid #2a2a2a;
}

.place-item:hover {
    background: #2a2a2a;
    transform: translateY(-4px);
    border-color: #444;
}

.place-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.cate-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 700;
    color: white;
}

.place-item h3 {
    margin: 0;
    font-size: 1.05rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.addr {
    font-size: 0.85rem;
    color: #999;
    margin: 0 0 12px 0;
    line-height: 1.4;
}

.place-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.distance {
    font-size: 0.8rem;
    color: #4a90e2;
    font-weight: 600;
}

.detail-link {
    font-size: 0.75rem;
    color: #888;
    text-decoration: none;
    padding: 4px 10px;
    border: 1px solid #333;
    border-radius: 6px;
    transition: all 0.2s;
}

.detail-link:hover {
    background: #333;
    color: white;
    border-color: #4a90e2;
}

.no-results {
    text-align: center;
    padding: 60px 0;
    color: #555;
    font-size: 0.9rem;
}

/* Scrollbar styling */
.results-section::-webkit-scrollbar {
    width: 8px;
}

.results-section::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
}
</style>
