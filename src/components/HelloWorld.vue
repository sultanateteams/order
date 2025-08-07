<template>
  <div class="p-4">
    <b-form @submit.stop.prevent="onSubmit">
      <h1>Ro'yhatdan o'tish</h1>
      <Inputs
        type="text"
        id="first-name"
        title="Ism: (*majburiy)"
        v-model="user.firstName"
        v-if="requiredFields.includes('firstName')"
        :required="true"
      />
      <Inputs
        type="text"
        id="last-name"
        title="Sharifingiz: (*majburiy)"
        v-model="user.lastName"
        v-if="requiredFields.includes('lastName')"
        :required="true"
      />

      <b-form-group
        label="Viloyatingizni tanlang: (*majburiy)"
        label-for="viloyat"
        v-if="requiredFields.includes('viloyat')"
      >
        <b-form-select
          id="viloyat"
          v-model="user.viloyat"
          :options="region"
          required
        ></b-form-select>
      </b-form-group>

      <b-form-group
        label="Tumaningizni tanlang: (*majburiy)"
        v-if="requiredFields.includes('tuman')"
        label-for="tuman"
      >
        <b-form-select
          id="tuman"
          v-model="user.tuman"
          :options="district"
          :disabled="!district.length"
          required
        ></b-form-select>
      </b-form-group>

      <Inputs
        type="text"
        v-if="requiredFields.includes('fullAddress')"
        id="full_address"
        title="Yashash manzilingizni aniq kiriting (mahalla, ko'cha, uy, raqam) (*ixtiyoriy)"
        v-model="user.fullAddress"
        :required="false"
      />
      <Inputs
        type="date"
        id="birth-date"
        v-if="requiredFields.includes('birthDate')"
        title="Tug'ilgan kuningni kiriting (*ixtiyoriy)"
        v-model="user.birthDate"
        :required="false"
      />
      <Inputs
        type="number"
        id="postcode"
        v-if="requiredFields.includes('postcode')"
        title="Po'chta indexingizni kiriting (*ixtiyoriy)"
        v-model="user.postcode"
        :required="false"
      />

      <MaskNumber
        id="phone_number"
        v-if="requiredFields.includes('phone_number')"
        title="Telefon raqamingiz (*ixtiyoriy)"
        v-model="user.phone_number"
        :required="false"
      />
    </b-form>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, reactive, watch, ref } from "vue";

import Inputs from "./ui/Inputs.vue";
import { viloyat, tuman } from "../constants/regions";
import MaskNumber from "./ui/MaskNumber.vue";

const region = viloyat
  .map((el) => ({ ...el, value: el.number, text: el.name1 }))
  .sort((a, b) => a.number - b.number);
console.log(region);
const district = ref([]);

const Telegram = window.Telegram.WebApp;

const queryParams = new URLSearchParams(window.location.search);
const requiredRaw = queryParams.get("required");
const requiredFields = requiredRaw
  ? requiredRaw.split("|")
  : [
      "firstName",
      "lastName",
      "viloyat",
      "viloyatInfo",
      "tuman",
      "tumanInfo",
      "fullAddress",
      "birthDate",
      "postcode",
      "phone_number",
    ];

onMounted(() => {
  Telegram.ready();

  Telegram.onEvent("mainButtonClicked", () => {
    const queryId = Telegram.initDataUnsafe?.query_id;

    user.viloyatInfo = viloyat.find((el) => user.viloyat == el.number);
    user.tumanInfo = tuman.find((el) => user.tuman == el.number);

    const payload = JSON.stringify({ user, queryId });

    if (queryId) {
      fetch("https://telegram-bota-da4625226d63.herokuapp.com/web-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });
    } else {
      Telegram.sendData(payload);
    }
  });
  console.log("working site");
});

const districtON = () => {
  district.value = tuman
    .filter((el) => el.parent_number == user.viloyat)
    .map((el) => ({ value: el.number, text: el.name1 }))
    .sort((a, b) => a.number - b.number);
};

const user = reactive({
  firstName: "",
  lastName: "",
  viloyat: null,
  viloyatInfo: {},
  tuman: null,
  tumanInfo: {},
  fullAddress: "",
  birthDate: "",
  postcode: "",
  phone_number: "",
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
  () => [user.firstName, user.lastName, user.viloyat, user.tuman],
  ([newName, newViloyat, newTuman]) => {
    if (newName.trim().length && newViloyat !== null && newTuman !== null) {
      console.log("✅ To‘liq ", JSON.parse(JSON.stringify(user)));
      if (Telegram.MainButton) {
        Telegram.MainButton.text = "Register";
        Telegram.MainButton.show();
      }
    }
  }
);
</script>
