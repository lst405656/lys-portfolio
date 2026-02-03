<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';

const router = useRouter();

const mapContainer = ref(null);
const searchKeyword = ref('');
const radius = ref(1000); 
const results = ref([]);
const categories = ref([]); 
const newCategoryInput = ref('');
const selectedCategories = ref([]);
const currentCenter = ref(null);
const isSearching = ref(false);

let map = null;
let ps = null;
let geocoder = null;
let markers = [];
let centerMarker = null;
let radiusCircle = null;

onMounted(() => {
    const savedCategories = localStorage.getItem('map_categories');
    if (savedCategories) {
        categories.value = JSON.parse(savedCategories);
        if (categories.value.length > 0) {
            selectedCategories.value = [categories.value[0].value];
        }
    } else {
        categories.value = [
            { name: '전시회', value: '전시회', color: '#FF6B6B' },
            { name: '미술관', value: '미술관', color: '#4ECDC4' }
        ];
        selectedCategories.value = ['전시회', '미술관'];
    }

    if (window.kakao && window.kakao.maps) {
        const options = {
            center: new kakao.maps.LatLng(37.566826, 126.9786567),
            level: 3
        };
        map = new kakao.maps.Map(mapContainer.value, options);
        ps = new kakao.maps.services.Places();
        geocoder = new kakao.maps.services.Geocoder();
    } else {
        console.error('카카오맵 라이브러리를 로드할 수 없습니다.');
    }
});

const saveCategories = () => {
    localStorage.setItem('map_categories', JSON.stringify(categories.value));
};

const getRandomColor = () => {
    const h = Math.floor(Math.random() * 360);
    return `hsl(${h}, 70%, 60%)`;
};

const addCategory = () => {
    const name = newCategoryInput.value.trim();
    if (!name) return;
    
    if (categories.value.some(c => c.value === name)) {
        alert('이미 존재하는 카테고리입니다.');
        return;
    }

    const newCat = {
        name: name,
        value: name,
        color: getRandomColor()
    };
    
    categories.value.push(newCat);
    selectedCategories.value.push(name);
    newCategoryInput.value = '';
    saveCategories();

    if (currentCenter.value) {
        searchPlacesByCategories(currentCenter.value);
    }
};

const removeCategory = (value) => {
    categories.value = categories.value.filter(c => c.value !== value);
    selectedCategories.value = selectedCategories.value.filter(v => v !== value);
    saveCategories();
    
    if (currentCenter.value) {
        searchPlacesByCategories(currentCenter.value);
    }
};

const toggleCategory = (value) => {
    const index = selectedCategories.value.indexOf(value);
    if (index > -1) {
        selectedCategories.value.splice(index, 1);
    } else {
        selectedCategories.value.push(value);
    }
    if (currentCenter.value) {
        searchPlacesByCategories(currentCenter.value);
    }
};

const searchLocation = () => {
    if (!searchKeyword.value.trim()) {
        alert('중심 위치를 입력하세요.');
        return;
    }

    ps.keywordSearch(searchKeyword.value, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const firstPlace = data[0];
            const center = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);
            
            currentCenter.value = center;
            map.setCenter(center);
            
            displayCenterMarker(center, firstPlace.place_name);
            drawRadiusCircle(center);
            searchPlacesByCategories(center);
        } else {
            alert('위치를 찾을 수 없습니다.');
        }
    });
};

const drawRadiusCircle = (center) => {
    if (radiusCircle) {
        radiusCircle.setMap(null);
    }

    radiusCircle = new kakao.maps.Circle({
        center: center,
        radius: radius.value,
        strokeWeight: 2,
        strokeColor: '#4a90e2',
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
        fillColor: '#4a90e2',
        fillOpacity: 0.1
    });

    radiusCircle.setMap(map);
};

watch(radius, (newRadius) => {
    if (currentCenter.value) {
        drawRadiusCircle(currentCenter.value);
        searchPlacesByCategories(currentCenter.value);
    }
});

const displayCenterMarker = (position, title) => {
    if (centerMarker) {
        centerMarker.setMap(null);
    }

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

const searchNaver = async (category, center) => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) return [];

    try {
        const query = encodeURIComponent(category);
        const url = `/api/naver/search/local.json?query=${query}&display=20`;
        
        const response = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            }
        });

        if (!response.ok) throw new Error('Naver API request failed');

        const data = await response.json();
        const naverResults = await Promise.all(data.items.map(async (item) => {
            return new Promise((resolve) => {
                geocoder.addressSearch(item.address, (result, status) => {
                    if (status === kakao.maps.services.Status.OK) {
                        const lat = result[0].y;
                        const lng = result[0].x;
                        const placeLatLng = new kakao.maps.LatLng(lat, lng);
                        const poly = new kakao.maps.Polyline({ path: [center, placeLatLng] });
                        const distance = Math.round(poly.getLength());

                        if (distance <= radius.value) {
                            // 지번 주소에서 번지수 뒷부분(상세 정보: 별관 1층 등) 추출
                            const detailMatch = item.address.match(/\d+(?:-\d+)?\s+(.+)/);
                            const detailInfo = detailMatch ? detailMatch[1] : '';
                            
                            resolve({
                                id: 'naver_' + Math.random(),
                                place_name: item.title.replace(/<[^>]*>?/gm, ''),
                                // 도로명 주소 + 상세 정보 조합
                                address: item.roadAddress ? (detailInfo ? `${item.roadAddress} ${detailInfo}` : item.roadAddress) : item.address,
                                x: lng,
                                y: lat,
                                distance: distance,
                                category_tag: category,
                                source: 'naver',
                                place_url: `https://search.naver.com/search.naver?query=${encodeURIComponent(item.title.replace(/<[^>]*>?/gm, ''))}`
                            });
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
        }));

        return naverResults.filter(r => r !== null);
    } catch (error) {
        console.error('Naver Search Error:', error);
        return [];
    }
};

const searchPlacesByCategories = async (center) => {
    isSearching.value = true;
    removeMarkers();
    results.value = [];
    
    if (selectedCategories.value.length === 0) {
        isSearching.value = false;
        return;
    }

    const allResults = [];
    const searchPromises = selectedCategories.value.map(async (category) => {
        const kakaoSearch = new Promise((resolve) => {
            ps.keywordSearch(category, (data, status) => {
                if (status === kakao.maps.services.Status.OK) {
                    const filtered = data.filter(place => {
                        const placeLatLng = new kakao.maps.LatLng(place.y, place.x);
                        const poly = new kakao.maps.Polyline({ path: [center, placeLatLng] });
                        const distance = Math.round(poly.getLength());
                        place.distance = distance;
                        place.category_tag = category;
                        place.source = 'kakao';

                        // 카카오 지번 주소에서 상세 정보 추출
                        const detailMatch = place.address_name.match(/\d+(?:-\d+)?\s+(.+)/);
                        const detailInfo = detailMatch ? detailMatch[1] : '';

                        // 도로명 주소 + 상세 정보 조합
                        place.address = place.road_address_name ? (detailInfo ? `${place.road_address_name} ${detailInfo}` : place.road_address_name) : place.address_name;
                        
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

        const naverItems = await searchNaver(category, center);
        const kakaoItems = await kakaoSearch;

        allResults.push(...kakaoItems, ...naverItems);
    });

    await Promise.all(searchPromises);

    const uniqueMap = new Map();
    allResults.forEach(item => {
        const key = item.place_name + item.address;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
        }
    });

    results.value = Array.from(uniqueMap.values()).sort((a, b) => a.distance - b.distance);

    results.value.forEach(place => {
        displayMarker(place);
    });
    isSearching.value = false;
};

const displayMarker = (place) => {
    const marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x)
    });
    markers.push(marker);

    const infowindow = new kakao.maps.InfoWindow({
        content: `
            <div style="padding:10px;font-size:12px;color:#333;width:150px;">
                <div style="font-weight:bold;margin-bottom:3px;">${place.place_name}</div>
                <div style="color:#666;font-size:11px;">[${place.source === 'naver' ? '네이버' : '카카오'}] ${place.category_tag}</div>
            </div>
        `
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

const downloadExcel = () => {
    if (results.value.length === 0) {
        alert('내려받을 목록이 없습니다.');
        return;
    }

    const data = results.value.map(item => ({
        '장소명': item.place_name,
        '카테고리': item.category_tag,
        '주소': item.address,
        '거리(m)': item.distance,
        '상세링크': item.place_url
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "검색결과");
    
    XLSX.writeFile(workbook, `문화공간_검색결과_${new Date().toISOString().split('T')[0]}.xlsx`);
};
</script>

<template>
    <div class="map-page">
        <div class="map-container" ref="mapContainer"></div>
        
        <div class="sidebar">
            <div class="search-section">
                <div class="header-row">
                    <h2>문화 공간 탐색</h2>
                    <div class="header-actions">
                        <button class="action-btn excel-btn" @click="downloadExcel" title="엑셀 다운로드" v-if="results.length > 0">
                            <span class="btn-icon">📥</span>
                        </button>
                        <button class="close-btn" @click="closeMap" title="포트폴리오로 돌아가기">
                            <span class="close-icon">×</span>
                        </button>
                    </div>
                </div>
                
                <div class="input-group">
                    <input 
                        v-model="searchKeyword" 
                        @keyup.enter="searchLocation"
                        placeholder="중심 위치 (예: 예술의 전당)" 
                    />
                    <button @click="searchLocation" class="main-btn">검색</button>
                </div>

                <div class="filter-group">
                    <label>카테고리 설정</label>
                    <div class="add-category">
                        <input 
                            v-model="newCategoryInput" 
                            @keyup.enter="addCategory"
                            placeholder="추가할 키워드 입력"
                        />
                        <button @click="addCategory">+</button>
                    </div>
                    <div class="category-tags">
                        <div 
                            v-for="cat in categories" 
                            :key="cat.value"
                            class="tag-wrapper"
                        >
                            <span 
                                class="tag-pill"
                                :class="{ active: selectedCategories.includes(cat.value) }"
                                :style="{ '--active-color': cat.color }"
                                @click="toggleCategory(cat.value)"
                            >
                                {{ cat.name }}
                            </span>
                            <button class="del-tag" @click="removeCategory(cat.value)">×</button>
                        </div>
                    </div>
                </div>

                <div class="filter-group">
                    <div class="label-row">
                        <label>검색 반경</label>
                        <span class="radius-val">{{ radius >= 1000 ? (radius/1000).toFixed(1) + 'km' : radius + 'm' }}</span>
                    </div>
                    <input type="range" v-model.number="radius" min="300" max="5000" step="100" />
                </div>
            </div>

            <div class="results-section">
                <div v-if="isSearching" class="loading">
                    데이터를 통합 검색 중입니다...
                </div>
                <div v-else-if="results.length === 0" class="no-results">
                    {{ currentCenter ? '해당 반경 내 결과가 없습니다.' : '먼저 위치를 검색해 보세요.' }}
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
                        <span class="source-tag" :class="place.source">{{ place.source === 'naver' ? 'N' : 'K' }}</span>
                        <h3>{{ place.place_name }}</h3>
                    </div>
                    <p class="addr">{{ place.address }}</p>
                    <div class="place-footer">
                        <span class="distance">📍 {{ place.distance >= 1000 ? (place.distance/1000).toFixed(1) + 'km' : place.distance + 'm' }}</span>
                        <a :href="place.place_url" target="_blank" class="detail-link" @click.stop>{{ place.source === 'naver' ? '네이버 맵' : '카카오 맵' }}</a>
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
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

.map-container {
    flex: 1;
    height: 100%;
}

.sidebar {
    width: 400px;
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

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.search-section h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #63b3ed, #4a90e2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.action-btn {
    background: #2d2d2d;
    border: none;
    color: #a0aec0;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.excel-btn:hover {
    background: #38a169;
    color: white;
    transform: translateY(-2px);
}

.close-btn {
    background: #2d2d2d;
    border: none;
    color: #a0aec0;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
    background: #e53e3e;
    color: white;
    transform: rotate(90deg);
}

.input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

.input-group input {
    flex: 1;
    padding: 14px 18px;
    border-radius: 14px;
    border: 1px solid #333;
    background: #121212;
    color: white;
    font-size: 0.95rem;
    outline: none;
}

.input-group input:focus {
    border-color: #4a90e2;
}

.main-btn {
    padding: 0 24px;
    border-radius: 14px;
    border: none;
    background: #4a90e2;
    color: white;
    font-weight: 700;
    cursor: pointer;
}

.filter-group {
    margin-bottom: 20px;
}

.filter-group label {
    display: block;
    font-size: 0.85rem;
    color: #718096;
    margin-bottom: 10px;
    font-weight: 700;
}

.add-category {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.add-category input {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    background: #121212;
    border: 1px solid #333;
    color: white;
    font-size: 0.85rem;
}

.add-category button {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: none;
    background: #2d3748;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
}

.category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.tag-wrapper {
    position: relative;
}

.tag-pill {
    padding: 6px 14px;
    border-radius: 100px;
    background: #2d3748;
    color: #a0aec0;
    font-size: 0.8rem;
    cursor: pointer;
}

.tag-pill.active {
    background: var(--active-color);
    color: white;
    font-weight: 700;
}

.del-tag {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #e53e3e;
    color: white;
    border: none;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
}

.tag-wrapper:hover .del-tag {
    opacity: 1;
}

.radius-val {
    color: #4a90e2;
    font-weight: 800;
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
    border-radius: 18px;
    margin-bottom: 16px;
    cursor: pointer;
    border: 1px solid #2d3748;
}

.source-tag {
    font-size: 10px;
    font-weight: 900;
    padding: 2px 4px;
    border-radius: 4px;
    margin-right: 5px;
}
.source-tag.naver { background: #2DB400; color: white; }
.source-tag.kakao { background: #FEE500; color: #3C1E1E; }

.place-item h3 {
    margin: 0;
    font-size: 1.1rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.addr {
    font-size: 0.85rem;
    color: #718096;
    margin: 10px 0;
}

.distance {
    font-size: 0.85rem;
    color: #4a90e2;
    font-weight: 800;
}

.detail-link {
    font-size: 0.75rem;
    color: #a0aec0;
    text-decoration: none;
    padding: 6px 14px;
    border: 1px solid #4a5568;
    border-radius: 10px;
}

.loading {
    text-align: center;
    padding: 40px;
    color: #4a90e2;
}

.no-results {
    text-align: center;
    padding: 80px 0;
    color: #4a5568;
}
</style>
