<script>
export default {
    name: "Default"
}
</script>
<template>
    <nav class="sidebar">		
        <router-link class="router-link" to="/">
            <p class="logo">LYS Port folio</p>
        </router-link>
        <router-link class="router-link" to="/portfolio">
            <p class="logo">Works</p>
        </router-link>
        <router-link class="router-link map-link" to="/map">
            <p class="logo">MAP</p>
        </router-link>
        <router-link class="router-link" to="/">
            <p class="logo">About</p>
        </router-link>
    </nav>
</template>

<style scoped>
.logo {
    font-family: "Futura", sans-serif;
    font-size: 24px; 
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    text-decoration: none;
}

.logo:hover {
	transform: scale(1.1);
}

.router-link {
    text-decoration: none;
}
</style>