<template>
  <div class="p-4 form-wrapper">
    <!-- Xato matni -->
    <h1 class="text-danger" v-if="errorText">{{ errorText }}</h1>

    <!-- Loader -->
    <div
      v-if="loading"
      class="d-flex justify-content-center align-items-center"
    >
      <b-spinner label="Yuklanmoqda..."></b-spinner>
      <span class="ms-2">Ma'lumotlar yuklanmoqda...</span>
    </div>

    <b-form @submit.stop.prevent="onSubmit" v-else>
      <h1>Yuk Ma'lumotlari</h1>

      <!-- Qidirishli Yuk egasi tanlash -->
      <div class="mb-3">
        <label for="owner_id" class="form-label">Yuk egasi</label>
        <b-form-input
          id="owner_id"
          v-model="search"
          placeholder="User ID yoki ism familiya bilan qidirish..."
          @focus="showDropdown = true"
          @input="showDropdown = true"
        ></b-form-input>

        <b-list-group
          v-if="showDropdown && filteredOptions.length"
          style="max-height: 200px; overflow-y: auto"
        >
          <b-list-group-item
            v-for="opt in filteredOptions"
            :key="opt.id"
            action
            @click="selectOption(opt)"
          >
            <strong>{{ opt.user_id }}</strong> — {{ opt.first_name }}
            {{ opt.last_name }}
          </b-list-group-item>
        </b-list-group>
      </div>

      <!-- Faqat yuk egasi tanlangandan keyin boshqa maydonlar chiqadi -->
      <template v-if="cargo.owner_id">
        <Inputs
          type="text"
          id="user_cargo_id"
          title="Foydalanuvchi yuk IDsi"
          v-model="cargo.user_cargo_id"
          :required="true"
        />

        <!-- Yuk holati -->
        <b-form-group label="Yuk holati" label-for="status">
          <b-form-select
            id="status"
            v-model="cargo.status"
            :options="
              statusOptions.map((opt) => ({
                value: opt.number,
                text: opt.name1,
              }))
            "
            required
          >
            <template #first>
              <b-form-select-option :value="null" disabled>
                Holatni tanlang...
              </b-form-select-option>
            </template>
          </b-form-select>
        </b-form-group>

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
      </template>
    </b-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch, computed } from "vue";
import Inputs from "./ui/Inputs.vue";
import supabase from "../config/supabazaClient";

const Telegram = window.Telegram.WebApp;
const queryParams = new URLSearchParams(window.location.search);
const org_id =
  queryParams.get("org_id") || "f67f4a71-9a10-43ae-ad9f-91d7dfa565a1" || null;
const requiredRaw = queryParams.get("required");
const requiredFields = requiredRaw
  ? requiredRaw.split("|")
  : [
      "owner_id",
      "user_cargo_id",
      "status",
      "in_stage_china",
      "stage_china_number",
      "barcode",
      "out_stage_china",
      "in_stage_uzb",
      "stage_number_uzbekistan",
      "submitted_at",
      "volume",
      "weight",
      "price",
    ];

const errorText = ref("");
const loading = ref(false);

const cargo = reactive({
  owner_id: null,
  user_cargo_id: null,
  status: null,
  in_stage_china: null,
  stage_china_number: null,
  barcode: null,
  out_stage_china: null,
  in_stage_uzb: null,
  stage_number_uzbekistan: null,
  submitted_at: null,
  volume: null,
  weight: null,
  price: null,
});

// Qidirish uchun o‘zgaruvchilar
const search = ref("");
const showDropdown = ref(false);
const options = ref([]);
const statusOptions = ref([]);

// Filtrlash
const filteredOptions = computed(() => {
  const term = search.value.toLowerCase();
  return options.value.filter(
    (u) =>
      u.user_id?.toString().toLowerCase().includes(term) ||
      u.first_name?.toLowerCase().includes(term) ||
      u.last_name?.toLowerCase().includes(term)
  );
});

// Tanlash
const selectOption = (opt) => {
  cargo.owner_id = opt.user_id;
  search.value = `${opt.user_id} — ${opt.first_name} ${opt.last_name}`;
  showDropdown.value = false;
};

// Payload yuborish funksiyasi
const sendPayload = () => {
  const queryId = Telegram.initDataUnsafe?.query_id;
  const payload = JSON.stringify({ cargo, queryId });

  if (queryId) {
    fetch("https://telegram-bota-da4625226d63.herokuapp.com/web-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  } else {
    Telegram.sendData(payload);
  }
};

// Telegram button tayyorlash
onMounted(async () => {
  Telegram.ready();

  Telegram.onEvent("mainButtonClicked", sendPayload);

  loading.value = true;
  if (org_id) {
    const { data, error } = await supabase
      .from("users")
      .select("id, user_id, first_name, last_name")
      .eq("state", 1)
      .eq("org_id", org_id)
      .neq("user_id", null);

    if (error) {
      errorText.value =
        "Supabase xato: " + (error.message || JSON.stringify(error));
    } else {
      options.value = data || [];
    }
  } else {
    errorText.value = "Organization ID not found";
  }

  const { data: statusData, error: statusError } = await supabase
    .from("lists")
    .select("*")
    .eq("state", 1)
    .eq("type_id", 6);

  if (statusError) {
    errorText.value =
      "Supabase xato: " + (statusError.message || JSON.stringify(statusError));
  } else {
    console.log(statusData);
    statusOptions.value = statusData || [];
  }
  loading.value = false;
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

<style scoped>
@media (max-width: 1092px) {
  .form-wrapper {
    width: 50% !important;
  }
}
@media (max-width: 772px) {
  .form-wrapper {
    width: 100% !important;
  }
}
@media (min-width: 1092px) {
  .form-wrapper {
    width: 40% !important;
  }
}
</style>
