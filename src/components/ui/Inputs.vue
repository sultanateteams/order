<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ title }}</label>
    <b-form-input
      class="w-100"
      :id="id"
      :value="modelValue"
      @input="updateValue"
      :state="validationState"
      :type="type"
    ></b-form-input>

    <b-form-invalid-feedback v-if="required" :state="validationState">
      {{ errorMessage }}
    </b-form-invalid-feedback>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from "vue";

// Props
const props = defineProps<{
  modelValue: string;
  id: string;
  title: string;
  required?: boolean;
  type: string;
}>();

const emit = defineEmits(["update:modelValue"]);

function updateValue(value: string) {
  emit("update:modelValue", value);
}

// Validatsiya sharti: faqat `required == true` bo‘lsa
const validationState = computed(() => {
  if (!props.required) return null; // validatsiya yo‘q
  return props.modelValue.length >= 3 && props.modelValue.length <= 100;
});

const errorMessage = computed(() => {
  return "Matn 3 dan 100 belgigacha bo‘lishi kerak.";
});
</script>
