import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
  BiHr,
  BiQuote,
  BiTextLeft,
  BiTypeH1,
  BiTypeH2,
  BiTypeH3,
  HiPlus,
  HiSolidSearch,
  HiTrash,
  MdDragindicator,
} from "oh-vue-icons/icons";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import "@dashibase/lotion/lib/style.css";
import "./assets/lotion-overrides.css";

addIcons(
  BiHr,
  BiQuote,
  BiTextLeft,
  BiTypeH1,
  BiTypeH2,
  BiTypeH3,
  HiPlus,
  HiSolidSearch,
  HiTrash,
  MdDragindicator,
);

const app = createApp(App);

app.component("v-icon", OhVueIcon);
app.use(createPinia());
app.use(router);
app.mount("#app");
