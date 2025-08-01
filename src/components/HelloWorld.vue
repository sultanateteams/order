<template>
  <div class="p-4">
    <b-form @submit.stop.prevent="onSubmit">
      <h1>Ro'yhatdan o'tish 2</h1>
      <Inputs
        id="full-name"
        title="Ism Sharifingiz:"
        v-model="user.fullName"
        :required="true"
      />

      <Inputs
        id="full_address"
        title="Yashash manzilingizni aniq kiriting (mahalla, ko'cha, uy, raqam)"
        v-model="user.fullAddress"
        :required="false"
      />

      <b-form-group label="Viloyatingizni tanlang:" label-for="viloyat">
        <b-form-select
          id="viloyat"
          v-model="user.viloyat"
          :options="region"
          required
        ></b-form-select>
      </b-form-group>

      <b-form-group label="Tumaningizni tanlang:" label-for="tuman">
        <b-form-select
          id="tuman"
          v-model="user.tuman"
          :options="district"
          :disabled="!district.length"
          required
        ></b-form-select>
      </b-form-group>
    </b-form>
  </div>
</template>

<script lang="ts" setup>
import Inputs from "./ui/Inputs.vue";
import { onMounted, computed, reactive, watch, ref } from "vue";
import { viloyat, tuman } from "../constants/regions";

const Telegram = window.Telegram.WebApp;

onMounted(() => {
  Telegram.ready();
  Telegram.onEvent("mainButtonClicked", JSON.stringify(user));
});

const region = viloyat.map((el) => ({ ...el, value: el.id, text: el.name1 }));
let district = ref([]);

const districtON = () => {
  district.value = tuman
    .filter((el) => el.int01 == user.viloyat)
    .map((el) => ({ value: el.id, text: el.name1 }));
};

console.log(viloyat, tuman);

const user = reactive({
  fullName: "",
  fullAddress: "",
  viloyat: null,
  tuman: null,
});

const regionData = computed(() => {
  if (!!user.viloyat) {
    return viloyat.filter((el) => el.id == user.viloyat)[0];
  } else {
    return {};
  }
});

watch(
  () => user.viloyat,
  () => {
    districtON();
  }
);

const onSubmit = () => {
  districtON();
};

watch(
  () => [user.fullName, user.viloyat, user.tuman],
  ([newName, newViloyat, newTuman]) => {
    if (newName.trim().length && newViloyat !== null && newTuman !== null) {
      console.log("✅ To‘liq maʼlumot:", JSON.parse(JSON.stringify(user)));
      Telegram.MainButton.text = "Register";
      Telegram.MainButton.show();
    }
  }
);
</script>
