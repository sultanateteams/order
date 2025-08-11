<template>
  <div class="p-4">
    <b-form @submit.stop.prevent="onSubmit">
      <h1>Yuk Ma'lumotlari</h1>

      <Inputs
        type="text"
        id="owner_id"
        title="Yuk egasi IDsi"
        v-model="cargo.owner_id"
        :required="true"
      />

      <Inputs
        type="text"
        id="user_cargo_id"
        title="Foydalanuvchi yuk IDsi"
        v-model="cargo.user_cargo_id"
        :required="true"
      />

      <Inputs
        type="text"
        id="status"
        title="Yuk holati"
        v-model="cargo.status"
        :required="true"
      />

      <Inputs
        type="date"
        id="in_stage_china"
        title="Xitoyga omborga kelgan vaqt"
        v-model="cargo.in_stage_china"
      />

      <Inputs
        type="text"
        id="stage_china_number"
        title="Xitoy ombor nomi"
        v-model="cargo.stage_china_number"
      />

      <Inputs
        type="number"
        id="barcode"
        title="Shtrix-kod"
        v-model="cargo.barcode"
      />

      <Inputs
        type="date"
        id="out_stage_china"
        title="Xitoydan ombordan ketgan vaqt"
        v-model="cargo.out_stage_china"
      />

      <Inputs
        type="date"
        id="in_stage_uzb"
        title="O'zbekistonga kelgan vaqt"
        v-model="cargo.in_stage_uzb"
      />

      <Inputs
        type="text"
        id="stage_number_uzbekistan"
        title="O'zbekistondagi ombor nomi"
        v-model="cargo.stage_number_uzbekistan"
      />

      <Inputs
        type="date"
        id="submitted_at"
        title="Mijoz qabul qilgan vaqt"
        v-model="cargo.submitted_at"
      />

      <Inputs
        type="text"
        id="submitted_by"
        title="Mijozga bergan"
        v-model="cargo.submitted_by"
      />

      <!-- Qo‘shimcha maydonlar -->
      <Inputs
        type="number"
        step="0.01"
        id="volume"
        title="Hajmi (m³)"
        v-model="cargo.volume"
      />

      <Inputs
        type="number"
        step="0.01"
        id="weight"
        title="Og'irligi (kg)"
        v-model="cargo.weight"
      />

      <Inputs
        type="number"
        id="price"
        title="Narxi (so'm)"
        v-model="cargo.price"
      />
    </b-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, watch } from "vue";
import Inputs from "./ui/Inputs.vue";

const Telegram = window.Telegram.WebApp;

const cargo = reactive({
  owner_id: "",
  user_cargo_id: "",
  status: "",
  in_stage_china: "",
  stage_china_number: null,
  barcode: null,
  out_stage_china: "",
  in_stage_uzb: "",
  stage_number_uzbekistan: null,
  submitted_at: "",
  submitted_by: "",
  volume: null, // Hajmi m³
  weight: null, // Og‘irligi kg
  price: null, // Narxi so‘m
});

// Payload yuborish funksiyasi
const sendPayload = () => {
  const queryId = Telegram.initDataUnsafe?.query_id;
  const payload = JSON.stringify({ cargo, queryId });

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
};

// Telegram button tayyorlash
onMounted(() => {
  Telegram.ready();

  Telegram.onEvent("mainButtonClicked", () => {
    sendPayload();
  });

  console.log("🚀 Yuk formasi tayyor");
});

// Tugma ko‘rsatish
watch(
  () => [cargo.owner_id, cargo.user_cargo_id, cargo.status],
  ([owner, userCargo, status]) => {
    if (owner && userCargo && status) {
      Telegram.MainButton.text = "Yuborish";
      Telegram.MainButton.show();
    } else {
      Telegram.MainButton.hide();
    }
  }
);

// Formani yuborish
const onSubmit = () => {
  sendPayload();
};
</script>
