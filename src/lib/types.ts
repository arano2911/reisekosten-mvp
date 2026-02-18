export type Assignment = {
  id: string;
  distance_km: number;
  assignment_type: "REGIONAL" | "UEBERREGIONAL";
  customers: {
    name: string;
  };
};
