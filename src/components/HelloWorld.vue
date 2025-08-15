<template>
  <div class="p-4 form-wrapper">
    <h1 class="text-danger" v-if="errorText">{{ errorText }}</h1>
    <div class="mb-3">
      <b-form-radio-group
        v-model="isUpdating"
        :options="[
          { text: 'Yangi qo‘shish', value: false },
          { text: 'Yangilash', value: true },
        ]"
      />
    </div>
    <div
      v-if="loading"
      class="d-flex justify-content-center align-items-center"
    >
      <b-spinner label="Yuklanmoqda..."></b-spinner>
      <span class="ms-2">Ma'lumotlar yuklanmoqda...</span>
    </div>

    <b-form v-else @submit.stop.prevent="onSubmit">
      <h1>{{ isUpdating ? "Yangilash" : "Yangi yuk ma'lumotlari" }}</h1>

      <!-- Owner qidirish -->
      <div class="mb-3">
        <label class="form-label">Yuk egasi</label>
        <b-form-input
          v-model="ownerSearch"
          placeholder="User ID yoki ism..."
          @focus="showOwnerDropdown = true"
        />
        <b-list-group
          v-if="showOwnerDropdown && filteredOwners.length"
          style="max-height: 200px; overflow-y: auto"
        >
          <b-list-group-item
            v-for="opt in filteredOwners"
            :key="opt.id"
            action
            @click="selectOwner(opt)"
          >
            <strong>{{ opt.user_id }}</strong> — {{ opt.first_name }}
            {{ opt.last_name }}
          </b-list-group-item>
        </b-list-group>
      </div>

      <!-- Order qidirish (faqat update bo‘lsa) -->
      <div class="mb-3" v-if="isUpdating">
        <label class="form-label">Buyurtma</label>
        <b-form-input
          v-model="orderSearch"
          placeholder="Order ID yoki yuk ID..."
          @focus="showOrderDropdown = true"
        />
        <b-list-group
          v-if="showOrderDropdown && filteredOrders.length"
          style="max-height: 200px; overflow-y: auto"
        >
          <b-list-group-item
            v-for="ord in filteredOrders"
            :key="ord.id"
            action
            @click="selectOrder(ord)"
          >
            {{ ord.owner_id }} - <strong>{{ ord.user_cargo_id }}</strong> —
            {{ ord.barcode }}
          </b-list-group-item>
        </b-list-group>
      </div>
      <template v-if="ownerSearch">
        <!-- Qayta yozish (faqat insert) -->
        <div v-if="isUpdating" class="mb-3">
          <b-form-checkbox v-model="overwriteAll">
            Qayta yozish (owner_id dan tashqari barcha maydonlar)
          </b-form-checkbox>
        </div>

        <!-- Form inputs -->
        <Inputs
          v-model="formData.user_cargo_id"
          type="text"
          id="user_cargo_id"
          title="Foydalanuvchi yuk IDsi"
          :readonly="!canEditField('user_cargo_id')"
        />

        <b-form-group label="Yuk holati">
          <b-form-select
            v-model="formData.status"
            :options="
              statusOptions.map((opt) => ({
                value: opt.number,
                text: opt.name1,
              }))
            "
            required
          >
            <template #first>
              <b-form-select-option :value="null" disabled
                >Holatni tanlang...</b-form-select-option
              >
            </template>
          </b-form-select>
        </b-form-group>

        <Inputs
          v-model="formData.in_stage_china"
          type="date"
          id="in_stage_china"
          title="Xitoyga kelgan"
          :readonly="!canEditField('in_stage_china')"
        />
        <Inputs
          v-model="formData.stage_china_number"
          type="text"
          id="stage_china_number"
          title="Xitoy ombor nomi"
          :readonly="!canEditField('stage_china_number')"
        />
        <Inputs
          v-model="formData.barcode"
          type="number"
          id="barcode"
          title="Shtrix-kod"
          :readonly="!canEditField('barcode')"
        />
        <Inputs
          v-model="formData.out_stage_china"
          type="date"
          id="out_stage_china"
          title="Xitoydan ketgan"
          :readonly="!canEditField('out_stage_china')"
        />
        <Inputs
          v-model="formData.in_stage_uzb"
          type="date"
          id="in_stage_uzb"
          title="O'zbekistonga kelgan"
          :readonly="!canEditField('in_stage_uzb')"
        />
        <Inputs
          v-model="formData.stage_number_uzbekistan"
          type="text"
          id="stage_number_uzbekistan"
          title="O'zbek ombor nomi"
          :readonly="!canEditField('stage_number_uzbekistan')"
        />
        <Inputs
          v-model="formData.submitted_at"
          type="date"
          id="submitted_at"
          title="Mijoz olgan vaqt"
          :readonly="!canEditField('submitted_at')"
        />
        <Inputs
          v-model="formData.volume"
          type="number"
          step="0.01"
          id="volume"
          title="Hajmi (m³)"
          :readonly="!canEditField('volume')"
        />
        <Inputs
          v-model="formData.weight"
          type="number"
          step="0.01"
          id="weight"
          title="Og'irligi (kg)"
          :readonly="!canEditField('weight')"
        />
        <Inputs
          v-model="formData.price"
          type="number"
          id="price"
          title="Narxi (so'm)"
          :readonly="!canEditField('price')"
        />
      </template>
    </b-form>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import Inputs from "./ui/Inputs.vue";
import supabase from "../config/supabazaClient";

const Telegram = window.Telegram.WebApp;
const queryParams = new URLSearchParams(window.location.search);
const org_id =
  queryParams.get("org_id") || "f67f4a71-9a10-43ae-ad9f-91d7dfa565a1";
const isUpdating = ref(false);

const errorText = ref("");
const loading = ref(false);
const overwriteAll = ref(false);

const formData = reactive({
  owner_id: null,
  user_cargo_id: null,
  status: null,
  in_stage_china: "",
  stage_china_number: null,
  barcode: null,
  out_stage_china: "",
  in_stage_uzb: "",
  stage_number_uzbekistan: null,
  submitted_at: "",
  volume: null,
  weight: null,
  price: null,
});

// 🔹 API bo'sh bergan maydonlarni saqlash
const emptyApiFields = ref([]);

// 🔹 foydalanuvchi o‘zgartirgan maydonlar
const editedFields = reactive({});

const canEditField = (field: string) => {
  // Agar yangi qo'shish rejimi bo'lsa — hamma tahrirlanadi
  if (!isUpdating.value) return true;

  // Agar "Qayta yozish" belgilangan bo'lsa — hamma tahrirlanadi
  if (overwriteAll.value) return true;

  // Foydalanuvchi shu maydonni o'zgartirgan bo'lsa — tahrirlanadi
  if (editedFields[field] !== undefined) return true;

  // API bo'sh qiymat bergan maydonlar ham tahrirlanadi
  if (emptyApiFields.value.includes(field)) return true;

  // Aks holda — blok
  return false;
};

// 🔹 formData'dagi o‘zgarishlarni kuzatib, editedFields'ga yozish
watch(
  formData,
  (newVal, oldVal) => {
    for (const key in newVal) {
      if (newVal[key] !== oldVal[key]) {
        editedFields[key] = newVal[key];
      }
    }
  },
  { deep: true }
);

watch(isUpdating, () => {
  for (const key in formData) {
    formData[key] = DATE_FIELDS.includes(key) ? "" : null;
  }
});

// Owner search
const ownerSearch = ref("");
const showOwnerDropdown = ref(false);
const owners = ref([]);
const filteredOwners = computed(() =>
  owners.value.filter((o) =>
    `${o.user_id} ${o.first_name} ${o.last_name}`
      .toLowerCase()
      .includes(ownerSearch.value.toLowerCase())
  )
);

// Order search
const orderSearch = ref("");
const showOrderDropdown = ref(false);
const ordersList = ref([]);
const filteredOrders = computed(() =>
  ordersList.value.filter((o) =>
    `${o.barcode} ${o.user_cargo_id} ${o.owner_id}`
      .toLowerCase()
      .includes(orderSearch.value.toLowerCase())
  )
);

const statusOptions = ref([]);
const DATE_FIELDS = [
  "in_stage_china",
  "out_stage_china",
  "in_stage_uzb",
  "submitted_at",
];

const selectOwner = (owner) => {
  formData.owner_id = owner.user_id;
  ownerSearch.value = `${owner.user_id} — ${owner.first_name} ${owner.last_name}`;
  showOwnerDropdown.value = false;
};

// 🔹 API’dan kelgan ma’lumotlarni set qilish va bo‘shlarini belgilash
const selectOrder = async (ord) => {
  emptyApiFields.value = [];

  if (ord.owner_id) {
    formData.owner_id = ord.owner_id;
    const owner = owners.value.find((o) => o.user_id === ord.owner_id);
    if (owner) {
      ownerSearch.value = `${owner.user_id} — ${owner.first_name} ${owner.last_name}`;
    }
  }

  for (const key in formData) {
    const val = DATE_FIELDS.includes(key)
      ? toDateInput(ord[key])
      : ord[key] ?? null;

    formData[key] = val;

    // API bo'sh qiymat berganini saqlash
    if (!val) {
      emptyApiFields.value.push(key);
    }
  }

  showOrderDropdown.value = false;
  await nextTick();
};

// Send only edited fields if updating
const sendPayload = () => {
  const queryId = Telegram.initDataUnsafe?.query_id;
  const payloadData = isUpdating ? editedFields : formData;

  const payload = JSON.stringify({
    order: { ...payloadData, isUpdating },
    queryId,
  });

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

sendPayload();

onMounted(async () => {
  Telegram.ready();
  loading.value = true;

  const { data: ownersData } = await supabase
    .from("users")
    .select("id, user_id, first_name, last_name")
    .eq("state", 1)
    .eq("org_id", org_id)
    .neq("user_id", null);
  if (ownersData) owners.value = ownersData;

  if (isUpdating) {
    const { data: ordersData, error: ordersError } = await supabase.rpc(
      "get_cargo_orders",
      { p_org_id: org_id }
    );
    if (ordersError) console.error("RPC xatolik:", ordersError);
    if (ordersData) ordersList.value = ordersData;
  }

  const { data: statusData } = await supabase
    .from("lists")
    .select("*")
    .eq("state", 1)
    .eq("type_id", 6);
  if (statusData) statusOptions.value = statusData;

  loading.value = false;
});

function toDateInput(date) {
  if (!date) return "";
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
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
