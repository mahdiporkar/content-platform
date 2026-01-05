let currentApplicationId = "";

export const tenantStore = {
  getApplicationId() {
    return currentApplicationId;
  },
  setApplicationId(value: string) {
    currentApplicationId = value;
  }
};
