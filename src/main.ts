import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { registerBlock } from "@dashibase/lotion";
import {
  BiHr,
  BiListCheck,
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
import TodoBlock from "./components/lotion/TodoBlock.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import "@dashibase/lotion/lib/style.css";
import "./assets/lotion-overrides.css";

addIcons(
  BiHr,
  BiListCheck,
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

registerBlock("TODO", "To-do list", TodoBlock, "bi-list-check");

const app = createApp(App);

app.component("v-icon", OhVueIcon);
app.use(createPinia());
app.use(router);
app.mount("#app");
