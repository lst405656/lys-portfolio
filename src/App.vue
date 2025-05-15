<script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";
import { DefaultMenu, ThreeMenu } from "../src/components/nav";

const route = useRoute();
document.title = "LYS-Portfolio";

const menuComponent = computed(() => {
	let menu = DefaultMenu;
	switch(route.name){
		case "home":
			menu = DefaultMenu;
			break;
		case "portfolio":
			menu = ThreeMenu;
			break;
		default:
			break;
	}
	return menu;
});
</script>

<template>
	<div class="container">
		<component :is="menuComponent"/>
		<div class="content">
			<router-view></router-view>
		</div>
	</div>
</template>

<style>
body {
	margin: 0;
	padding: 0;
	background-color: black;
}
</style>
<style scoped>
.container {
	display: flex;
	height: 100vh;
}

.sidebar {
	width: 80px;
	position: fixed;
	top: 0;
	left: 0;
	background-color: black;
	display: flex;
	margin: 20px;
}

.content {
	margin-left: 100px;
	flex: 1;
	padding: 0 20px 20px 20px;
}
</style>