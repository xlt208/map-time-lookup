export interface LocationTime {
  id: string;
  label: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  isLoading: boolean;
  error?: string;
}
